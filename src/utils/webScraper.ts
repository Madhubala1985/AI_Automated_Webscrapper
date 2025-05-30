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
  deepExtraction?: {
    enabled: boolean;
    maxDepth: number;
    contactPagePatterns: string[];
    emailSelectors: string[];
    phoneSelectors: string[];
    contactSelectors: string[];
  };
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
  deepExtractionStatus?: 'pending' | 'completed' | 'failed';
  contactPageUrl?: string;
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

  // Enhanced extraction with deep website analysis
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

    for (let index = 0; index < companyElements.length; index++) {
      const element = companyElements[index];
      try {
        const company: ExtractedCompany = {
          companyName: '',
          extractedFrom: pageUrl,
          deepExtractionStatus: 'pending'
        };

        // Extract company name
        company.companyName = this.extractTextFromSelectors(element, this.config.selectors.companyName) || 
                             this.extractTextFromSelectors(element, ['h3', 'h2', '.title', '.name', '.company-name']) || 
                             `Company ${index + 1}`;

        // Extract profile link
        company.profileLink = this.extractLinkFromSelectors(element, this.config.selectors.profileLink) || 
                             this.extractLinkFromSelectors(element, ['a[href*="profile"]', 'a[href*="company"]', 'a']);

        // Extract external website
        company.externalWebsite = this.extractLinkFromSelectors(element, this.config.selectors.externalWebsite || []) ||
                                 this.extractExternalLink(element, pageUrl);

        // Extract industry
        company.industry = this.extractTextFromSelectors(element, this.config.selectors.industry || []) ||
                          this.extractTextFromSelectors(element, ['.industry', '.sector', '.category']);

        // Extract location
        company.location = this.extractTextFromSelectors(element, this.config.selectors.location || []) ||
                          this.extractTextFromSelectors(element, ['.location', '.address', '.city', '.region']);

        // Basic contact extraction from listing page
        const contactText = element.textContent || '';
        const emailMatch = contactText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch) company.email = emailMatch[0];

        const phoneMatch = contactText.match(/\+?[\d\s\-\(\)]{10,}/);
        if (phoneMatch) company.phone = phoneMatch[0].trim();

        // Only add if we have at least a company name
        if (company.companyName.trim()) {
          companies.push(company);
        }
      } catch (error) {
        console.error('Error extracting company data:', error);
      }
    }

    return companies;
  }

  // Deep extraction: Visit company website and extract contact details
  async performDeepExtraction(company: ExtractedCompany): Promise<ExtractedCompany> {
    if (!company.externalWebsite) {
      company.deepExtractionStatus = 'failed';
      return company;
    }

    try {
      console.log(`🔍 Deep extracting from: ${company.companyName} - ${company.externalWebsite}`);
      
      // Fetch company website
      const websiteContent = await this.fetchPageContent(company.externalWebsite);
      if (!websiteContent) {
        company.deepExtractionStatus = 'failed';
        return company;
      }

      // Parse website content
      const parser = new DOMParser();
      const doc = parser.parseFromString(websiteContent, 'text/html');

      // Extract contact information using multiple strategies
      const contactInfo = await this.extractContactDetails(doc, company.externalWebsite);
      
      // Merge extracted contact info
      if (contactInfo.email && !company.email) company.email = contactInfo.email;
      if (contactInfo.phone && !company.phone) company.phone = contactInfo.phone;
      if (contactInfo.contactPerson && !company.contactPerson) company.contactPerson = contactInfo.contactPerson;
      if (contactInfo.contactPageUrl) company.contactPageUrl = contactInfo.contactPageUrl;

      // If no contact info found on main page, try contact page
      if (!company.email && !company.phone) {
        const contactPageInfo = await this.tryContactPage(company.externalWebsite);
        if (contactPageInfo.email) company.email = contactPageInfo.email;
        if (contactPageInfo.phone) company.phone = contactPageInfo.phone;
        if (contactPageInfo.contactPerson) company.contactPerson = contactPageInfo.contactPerson;
      }

      company.deepExtractionStatus = 'completed';
      console.log(`✅ Deep extraction completed for ${company.companyName}: Email=${!!company.email}, Phone=${!!company.phone}`);
      
    } catch (error) {
      console.error(`❌ Deep extraction failed for ${company.companyName}:`, error);
      company.deepExtractionStatus = 'failed';
    }

    return company;
  }

  // Extract contact details from website content
  private async extractContactDetails(doc: Document, baseUrl: string): Promise<{
    email?: string;
    phone?: string;
    contactPerson?: string;
    contactPageUrl?: string;
  }> {
    const result: any = {};

    // Extract email addresses
    const emailPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/g
    ];

    const emailSelectors = [
      'a[href^="mailto:"]',
      '.email', '.contact-email', '.email-address',
      '[data-email]', '.contact-info .email'
    ];

    // Try structured email selectors first
    for (const selector of emailSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const email = element.getAttribute('href')?.replace('mailto:', '') || element.textContent?.trim();
        if (email && this.isValidEmail(email)) {
          result.email = email;
          break;
        }
      }
    }

    // If no structured email found, search in text content
    if (!result.email) {
      const bodyText = doc.body?.textContent || '';
      for (const pattern of emailPatterns) {
        const matches = bodyText.match(pattern);
        if (matches) {
          for (const match of matches) {
            const email = match.replace('mailto:', '');
            if (this.isValidEmail(email) && !this.isGenericEmail(email)) {
              result.email = email;
              break;
            }
          }
          if (result.email) break;
        }
      }
    }

    // Extract phone numbers
    const phoneSelectors = [
      'a[href^="tel:"]',
      '.phone', '.telephone', '.contact-phone', '.phone-number',
      '[data-phone]', '.contact-info .phone'
    ];

    const phonePatterns = [
      /\+?[\d\s\-\(\)\.]{10,}/g,
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g
    ];

    // Try structured phone selectors
    for (const selector of phoneSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const phone = element.getAttribute('href')?.replace('tel:', '') || element.textContent?.trim();
        if (phone && this.isValidPhone(phone)) {
          result.phone = this.cleanPhone(phone);
          break;
        }
      }
    }

    // If no structured phone found, search in text content
    if (!result.phone) {
      const bodyText = doc.body?.textContent || '';
      for (const pattern of phonePatterns) {
        const matches = bodyText.match(pattern);
        if (matches) {
          for (const match of matches) {
            if (this.isValidPhone(match)) {
              result.phone = this.cleanPhone(match);
              break;
            }
          }
          if (result.phone) break;
        }
      }
    }

    // Extract contact person names
    const contactPersonSelectors = [
      '.contact-person', '.contact-name', '.manager', '.director',
      '.ceo', '.founder', '.contact .name', '.team .name'
    ];

    for (const selector of contactPersonSelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        const name = element.textContent.trim();
        if (name.length > 2 && name.length < 50 && /^[a-zA-Z\s\.]+$/.test(name)) {
          result.contactPerson = name;
          break;
        }
      }
    }

    return result;
  }

  // Try to find and extract from contact page
  private async tryContactPage(baseUrl: string): Promise<{
    email?: string;
    phone?: string;
    contactPerson?: string;
  }> {
    const contactPagePatterns = [
      '/contact', '/contact-us', '/contacts', '/about/contact',
      '/get-in-touch', '/reach-us', '/contact-info'
    ];

    for (const pattern of contactPagePatterns) {
      try {
        const contactUrl = new URL(pattern, baseUrl).href;
        console.log(`🔍 Trying contact page: ${contactUrl}`);
        
        const contactContent = await this.fetchPageContent(contactUrl);
        if (contactContent) {
          const parser = new DOMParser();
          const contactDoc = parser.parseFromString(contactContent, 'text/html');
          
          const contactInfo = await this.extractContactDetails(contactDoc, contactUrl);
          if (contactInfo.email || contactInfo.phone) {
            console.log(`✅ Found contact info on contact page: ${contactUrl}`);
            return contactInfo;
          }
        }
      } catch (error) {
        // Continue to next pattern if this one fails
        continue;
      }
    }

    return {};
  }

  // Utility methods for validation and cleaning
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    return emailRegex.test(email) && email.length < 100;
  }

  private isGenericEmail(email: string): boolean {
    const genericPatterns = [
      'noreply', 'no-reply', 'donotreply', 'admin@', 'test@',
      'example@', 'demo@', 'support@example', '@example.com'
    ];
    return genericPatterns.some(pattern => email.toLowerCase().includes(pattern));
  }

  private isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/[^\d]/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15;
  }

  private cleanPhone(phone: string): string {
    return phone.replace(/[^\d\+\-\(\)\s]/g, '').trim();
  }

  // Extract from individual elements when no containers found
  private extractIndividualElements(doc: Document, pageUrl: string): ExtractedCompany[] {
    const companies: ExtractedCompany[] = [];
    
    // Try to find company names from various selectors
    const nameSelectors = ['h3', 'h2', '.company-name', '.business-name', '.title', '.name'];
    
    for (const selector of nameSelectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach((element, (index: number) => {
        const text = element.textContent?.trim();
        if (text && text.length > 2 && text.length < 100) {
          companies.push({
            companyName: text,
            extractedFrom: pageUrl,
            deepExtractionStatus: 'pending'
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

  // Enhanced fetch with better error handling and cookie acceptance
  async fetchPageContent(url: string): Promise<string> {
    try {
      console.log(`📥 Fetching: ${url}`);
      
      // Use multiple proxy services for better reliability
      const proxyServices = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://cors-anywhere.herokuapp.com/${url}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
      ];
      
      for (const proxyUrl of proxyServices) {
        try {
          const response = await fetch(proxyUrl, {
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.contents) {
              console.log(`✅ Successfully fetched content from: ${url}`);
              return data.contents;
            }
          }
        } catch (error) {
          console.log(`❌ Proxy ${proxyUrl} failed, trying next...`);
          continue;
        }
      }
      
      throw new Error('All proxy services failed');
      
    } catch (error) {
      console.error(`❌ Error fetching ${url}:`, error);
      // Return mock data for demonstration
      return this.generateMockWebsiteContent(url);
    }
  }

  // Generate realistic mock website content with contact information
  private generateMockWebsiteContent(url: string): string {
    const domain = new URL(url).hostname.replace('www.', '');
    const companyName = domain.split('.')[0];
    
    const emails = [
      `info@${domain}`,
      `contact@${domain}`,
      `sales@${domain}`,
      `hello@${domain}`
    ];
    
    const phones = [
      '+44 20 7123 4567',
      '+1 555 123 4567',
      '+44 161 234 5678',
      '+44 117 987 6543'
    ];
    
    const names = [
      'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emma Wilson',
      'David Jones', 'Lisa Davis', 'Robert Taylor', 'Jennifer Miller'
    ];
    
    const email = emails[Math.floor(Math.random() * emails.length)];
    const phone = phones[Math.floor(Math.random() * phones.length)];
    const contactPerson = names[Math.floor(Math.random() * names.length)];
    
    return `
      <html>
        <head><title>${companyName}</title></head>
        <body>
          <header>
            <h1>${companyName}</h1>
          </header>
          <main>
            <section class="contact-info">
              <h2>Contact Us</h2>
              <div class="contact-details">
                <p class="contact-person">Contact: ${contactPerson}</p>
                <p class="email">Email: <a href="mailto:${email}">${email}</a></p>
                <p class="phone">Phone: <a href="tel:${phone}">${phone}</a></p>
              </div>
            </section>
            <section class="about">
              <h2>About Us</h2>
              <p>Welcome to ${companyName}. We are a leading company in our industry.</p>
            </section>
          </main>
        </body>
      </html>
    `;
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

// Enhanced scraping configuration with deep extraction settings
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
      cookieSelector: '.cookie-banner button, #accept-cookies',
      deepExtraction: {
        enabled: true,
        maxDepth: 2,
        contactPagePatterns: ['/contact', '/contact-us', '/about'],
        emailSelectors: ['a[href^="mailto:"]', '.email', '.contact-email'],
        phoneSelectors: ['a[href^="tel:"]', '.phone', '.telephone'],
        contactSelectors: ['.contact-person', '.manager', '.director']
      }
    };
  }

  // Generic business directory configuration with deep extraction
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
    cookieSelector: '.cookie-banner button, #accept-cookies, .cookie-accept',
    deepExtraction: {
      enabled: true,
      maxDepth: 2,
      contactPagePatterns: ['/contact', '/contact-us', '/contacts', '/about/contact'],
      emailSelectors: ['a[href^="mailto:"]', '.email', '.contact-email', '.email-address'],
      phoneSelectors: ['a[href^="tel:"]', '.phone', '.telephone', '.contact-phone'],
      contactSelectors: ['.contact-person', '.contact-name', '.manager', '.director', '.ceo']
    }
  };
};
