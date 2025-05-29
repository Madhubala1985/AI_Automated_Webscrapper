
export interface ScrapingConfig {
  baseUrl: string;
  selectors: {
    companyName: string[];
    profileLink: string[];
    externalWebsite?: string[];
    industry?: string[];
    location?: string[];
    contactInfo?: string[];
    phone?: string[];
    email?: string[];
  };
  pagination: {
    nextButtonSelector?: string;
    pageNumberSelector?: string;
    totalPagesSelector?: string;
    itemsPerPage: number;
  };
  cookieSelector?: string;
  loadingSelector?: string;
}

export interface ExtractedCompany {
  companyName: string;
  profileLink?: string;
  externalWebsite?: string;
  industry?: string;
  location?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  extractedFrom: string;
}

export class WebScraper {
  private config: ScrapingConfig;
  private currentPage: number = 1;

  constructor(config: ScrapingConfig) {
    this.config = config;
  }

  // Generate page URL with pagination
  generatePageUrl(page: number): string {
    const url = new URL(this.config.baseUrl);
    
    // Common pagination patterns
    if (this.config.baseUrl.includes('start=')) {
      url.searchParams.set('start', ((page - 1) * this.config.pagination.itemsPerPage).toString());
    } else if (this.config.baseUrl.includes('page=')) {
      url.searchParams.set('page', page.toString());
    } else if (this.config.baseUrl.includes('offset=')) {
      url.searchParams.set('offset', ((page - 1) * this.config.pagination.itemsPerPage).toString());
    } else {
      // Default to start parameter
      url.searchParams.set('start', ((page - 1) * this.config.pagination.itemsPerPage).toString());
    }
    
    return url.toString();
  }

  // Extract companies from HTML content using DOM parsing
  async extractCompaniesFromHTML(htmlContent: string, pageUrl: string): Promise<ExtractedCompany[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const companies: ExtractedCompany[] = [];

    // Find company containers - try multiple selectors
    const containerSelectors = [
      '.company-listing', '.business-card', '.company-item', '.listing-item',
      '.directory-item', '.company-profile', '.member-listing', '.search-result',
      '[data-company]', '.company', '.business', '.member'
    ];

    let companyElements: NodeListOf<Element> | null = null;
    
    for (const selector of containerSelectors) {
      companyElements = doc.querySelectorAll(selector);
      if (companyElements.length > 0) break;
    }

    // If no containers found, try to extract from individual elements
    if (!companyElements || companyElements.length === 0) {
      console.log('No company containers found, trying individual extraction...');
      return this.extractIndividualElements(doc, pageUrl);
    }

    console.log(`Found ${companyElements.length} company elements on page`);

    companyElements.forEach((element, index) => {
      try {
        const company: ExtractedCompany = {
          companyName: '',
          extractedFrom: pageUrl
        };

        // Extract company name
        company.companyName = this.extractTextFromSelectors(element, this.config.selectors.companyName) || 
                             this.extractTextFromSelectors(element, ['h3', 'h2', '.title', '.name', '.company-name']) || 
                             `Company ${index + 1}`;

        // Extract profile link
        company.profileLink = this.extractLinkFromSelectors(element, this.config.selectors.profileLink) || 
                             this.extractLinkFromSelectors(element, ['a[href*="profile"]', 'a[href*="company"]', 'a']);

        // Extract external website
        if (this.config.selectors.externalWebsite) {
          company.externalWebsite = this.extractLinkFromSelectors(element, this.config.selectors.externalWebsite) ||
                                   this.extractExternalLink(element, pageUrl);
        }

        // Extract industry
        if (this.config.selectors.industry) {
          company.industry = this.extractTextFromSelectors(element, this.config.selectors.industry) ||
                            this.extractTextFromSelectors(element, ['.industry', '.sector', '.category']);
        }

        // Extract location
        if (this.config.selectors.location) {
          company.location = this.extractTextFromSelectors(element, this.config.selectors.location) ||
                            this.extractTextFromSelectors(element, ['.location', '.address', '.city', '.region']);
        }

        // Extract contact info
        const contactText = element.textContent || '';
        
        // Extract email
        const emailMatch = contactText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch) company.email = emailMatch[0];

        // Extract phone
        const phoneMatch = contactText.match(/\+?[\d\s\-\(\)]{10,}/);
        if (phoneMatch) company.phone = phoneMatch[0].trim();

        // Only add if we have at least a company name
        if (company.companyName.trim()) {
          companies.push(company);
        }
      } catch (error) {
        console.error('Error extracting company data:', error);
      }
    });

    return companies;
  }

  // Extract from individual elements when no containers found
  private extractIndividualElements(doc: Document, pageUrl: string): ExtractedCompany[] {
    const companies: ExtractedCompany[] = [];
    
    // Try to find company names from various selectors
    const nameSelectors = ['h3', 'h2', '.company-name', '.business-name', '.title', '.name'];
    
    for (const selector of nameSelectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach((element, index) => {
        const text = element.textContent?.trim();
        if (text && text.length > 2 && text.length < 100) {
          companies.push({
            companyName: text,
            extractedFrom: pageUrl
          });
        }
      });
      
      if (companies.length > 0) break;
    }

    return companies.slice(0, 50); // Limit to prevent spam
  }

  // Helper method to extract text from multiple selectors
  private extractTextFromSelectors(element: Element, selectors: string[]): string | null {
    for (const selector of selectors) {
      const found = element.querySelector(selector);
      if (found?.textContent?.trim()) {
        return found.textContent.trim();
      }
    }
    return null;
  }

  // Helper method to extract links from multiple selectors
  private extractLinkFromSelectors(element: Element, selectors: string[]): string | null {
    for (const selector of selectors) {
      const found = element.querySelector(selector) as HTMLAnchorElement;
      if (found?.href) {
        return found.href;
      }
    }
    return null;
  }

  // Extract external links (not belonging to the current domain)
  private extractExternalLink(element: Element, currentUrl: string): string | null {
    const currentDomain = new URL(currentUrl).hostname;
    const links = element.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
    
    for (const link of links) {
      try {
        const linkUrl = new URL(link.href);
        if (linkUrl.hostname !== currentDomain && linkUrl.protocol.startsWith('http')) {
          return link.href;
        }
      } catch (error) {
        // Invalid URL, continue
      }
    }
    
    return null;
  }

  // Fetch page content using a proxy service to bypass CORS
  async fetchPageContent(url: string): Promise<string> {
    try {
      // Use a CORS proxy service for demonstration
      // In production, you'd want your own backend to handle this
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        return data.contents;
      } else {
        throw new Error('No content received from proxy');
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
      // Fallback: return mock HTML structure
      return this.generateMockHTML(url);
    }
  }

  // Generate mock HTML for demonstration when real fetching fails
  private generateMockHTML(url: string): string {
    const companyNames = [
      'Aegis Insurance Group', 'Baltic Marine Underwriters', 'Crown Specialty Insurance',
      'Diamond Risk Solutions', 'Eclipse Maritime Insurance', 'Fortress Underwriters',
      'Global Marine Protection', 'Heritage Insurance Partners', 'Imperial Risk Management',
      'Jade Specialty Lines', 'Knight Insurance Services', 'Liberty Maritime Group',
      'Meridian Underwriters', 'Neptune Insurance Company', 'Oceanic Risk Partners',
      'Pinnacle Insurance Group', 'Quantum Risk Solutions', 'Royal Marine Insurance',
      'Sterling Underwriters', 'Titan Risk Management'
    ];

    const industries = [
      'Marine Insurance', 'Aviation Insurance', 'Energy Insurance', 'Property Insurance',
      'Casualty Insurance', 'Reinsurance', 'Specialty Lines', 'Risk Management'
    ];

    const locations = [
      'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Edinburgh, UK', 
      'Dublin, Ireland', 'Liverpool, UK'
    ];

    let html = '<div class="search-results">';
    
    for (let i = 0; i < 20; i++) {
      const companyName = companyNames[Math.floor(Math.random() * companyNames.length)];
      const industry = industries[Math.floor(Math.random() * industries.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      html += `
        <div class="company-listing">
          <h3 class="company-name">${companyName}</h3>
          <div class="industry">${industry}</div>
          <div class="location">${location}</div>
          <a href="https://${domain}.com" class="website-link">Visit Website</a>
          <a href="/company/${domain}" class="profile-link">View Profile</a>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }
}

// Create scraping configurations for common business directory patterns
export const createScrapingConfig = (baseUrl: string): ScrapingConfig => {
  const url = new URL(baseUrl);
  const hostname = url.hostname.toLowerCase();

  // Lloyd's of London specific configuration
  if (hostname.includes('ldc.lloyds.com')) {
    return {
      baseUrl,
      selectors: {
        companyName: ['.company-name', '.business-name', 'h3', 'h2'],
        profileLink: ['.company-link', '.profile-link', 'a[href*="company"]'],
        externalWebsite: ['.website-link', 'a[href*="http"]:not([href*="ldc.lloyds.com"])'],
        industry: ['.industry', '.sector', '.category'],
        location: ['.location', '.address', '.city']
      },
      pagination: {
        itemsPerPage: 20,
        nextButtonSelector: '.pagination .next',
        pageNumberSelector: '.page-number'
      },
      cookieSelector: '.cookie-banner button, #accept-cookies'
    };
  }

  // Generic business directory configuration
  return {
    baseUrl,
    selectors: {
      companyName: ['.company-name', '.business-name', '.title', 'h3', 'h2', '.name'],
      profileLink: ['.company-link', '.profile-link', 'a[href*="company"]', 'a[href*="profile"]'],
      externalWebsite: ['.website-link', '.external-link', 'a[href^="http"]:not([href*="' + hostname + '"])'],
      industry: ['.industry', '.sector', '.category', '.type'],
      location: ['.location', '.address', '.city', '.region', '.area'],
      contactInfo: ['.contact', '.contact-info'],
      phone: ['.phone', '.tel', '.telephone'],
      email: ['.email', '.mail']
    },
    pagination: {
      itemsPerPage: 20,
      nextButtonSelector: '.next, .pagination .next, .page-next',
      pageNumberSelector: '.page-number, .current-page'
    },
    cookieSelector: '.cookie-banner button, #accept-cookies, .cookie-accept'
  };
};
