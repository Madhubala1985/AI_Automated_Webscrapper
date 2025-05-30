import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, Square, Globe, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { CompanyLead } from '../types/leadGeneration';
import { WebScraper, createScrapingConfig, ExtractedCompany } from '../utils/webScraper';

interface FullWebsiteScraperProps {
  baseUrl: string;
  totalPages: number;
  onLeadsExtracted: (leads: CompanyLead[]) => void;
}

const FullWebsiteScraper: React.FC<FullWebsiteScraperProps> = ({
  baseUrl,
  totalPages,
  onLeadsExtracted
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalExtracted, setTotalExtracted] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [allExtractedLeads, setAllExtractedLeads] = useState<CompanyLead[]>([]);
  const [deepExtractionProgress, setDeepExtractionProgress] = useState({ current: 0, total: 0 });
  const [currentlyProcessing, setCurrentlyProcessing] = useState('');
  const stopRequested = useRef(false);
  const pauseRequested = useRef(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[${timestamp}] ${message}`);
  };

  const addError = (error: string) => {
    setErrors(prev => [...prev, error]);
    addLog(`❌ ERROR: ${error}`);
    console.error('Scraping Error:', error);
  };

  const convertExtractedToLead = (extracted: ExtractedCompany): CompanyLead => {
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      companyName: extracted.companyName,
      externalWebsite: extracted.externalWebsite,
      industry: extracted.industry,
      location: extracted.location,
      contactPerson: extracted.contactPerson,
      email: extracted.email,
      phone: extracted.phone,
      extractedFrom: extracted.extractedFrom,
      lastUpdated: new Date(),
      status: (extracted.email || extracted.phone) ? 'enriched' : 'extracted',
      enrichedSource: !!(extracted.email || extracted.phone)
    };
  };

  const startFullScraping = async () => {
    setIsRunning(true);
    setIsPaused(false);
    setCurrentPage(1);
    setTotalExtracted(0);
    setProgress(0);
    setLogs([]);
    setErrors([]);
    setAllExtractedLeads([]);
    setDeepExtractionProgress({ current: 0, total: 0 });
    setCurrentlyProcessing('');
    stopRequested.current = false;
    pauseRequested.current = false;

    try {
      // Initialize scraper with enhanced configuration
      const scrapingConfig = createScrapingConfig(baseUrl);
      const scraper = new WebScraper(scrapingConfig);

      setCurrentStatus('🤖 AI-powered deep web scraper initializing...');
      addLog('=== ENHANCED DEEP WEB SCRAPING STARTED ===');
      addLog(`Target: ${baseUrl}`);
      addLog(`Deep extraction for ${totalPages} pages with contact enrichment`);
      addLog('Using AI-powered DOM analysis, website visiting, and contact extraction');

      let allLeads: CompanyLead[] = [];
      let successfulPages = 0;
      let failedPages = 0;
      let totalCompaniesForDeepExtraction: ExtractedCompany[] = [];

      // Phase 1: Extract basic company information from directory pages
      addLog('📋 PHASE 1: Extracting company listings from directory');
      for (let page = 1; page <= totalPages; page++) {
        if (stopRequested.current) {
          addLog(`🛑 Scraping stopped by user at page ${page}`);
          break;
        }

        if (pauseRequested.current) {
          setCurrentStatus('⏸️ Scraping paused');
          addLog(`⏸️ Scraping paused at page ${page}`);
          while (pauseRequested.current && !stopRequested.current) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          if (stopRequested.current) break;
          setCurrentStatus('▶️ Resuming scraping...');
          addLog(`▶️ Resuming scraping from page ${page}`);
        }

        setCurrentPage(page);
        setCurrentStatus(`🔍 AI analyzing directory page ${page}/${totalPages}...`);
        
        try {
          const pageUrl = scraper.generatePageUrl(page);
          addLog(`🌐 Fetching directory page ${page}: ${pageUrl}`);

          setCurrentStatus(`📥 Downloading page ${page} content...`);
          const htmlContent = await scraper.fetchPageContent(pageUrl);
          
          if (!htmlContent || htmlContent.length < 100) {
            addError(`Page ${page} returned insufficient content`);
            failedPages++;
            continue;
          }

          setCurrentStatus(`🤖 AI extracting companies from page ${page}...`);
          addLog(`🔍 AI analyzing DOM structure on page ${page}`);

          const extractedCompanies = await scraper.extractCompaniesFromHTML(htmlContent, pageUrl);
          
          if (extractedCompanies.length === 0) {
            addLog(`⚠️ No companies found on page ${page}`);
            failedPages++;
            continue;
          }

          // Add to collection for deep extraction
          totalCompaniesForDeepExtraction = [...totalCompaniesForDeepExtraction, ...extractedCompanies];
          
          addLog(`✅ Page ${page}: Found ${extractedCompanies.length} companies (Total: ${totalCompaniesForDeepExtraction.length})`);
          successfulPages++;

          // Update progress for phase 1
          setProgress((page / totalPages) * 50); // First 50% for directory extraction

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (page % 25 === 0) {
            toast.info(`Directory scan: ${page}/${totalPages} pages • ${totalCompaniesForDeepExtraction.length} companies found`);
          }

        } catch (error) {
          const errorMsg = `Failed to process page ${page}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          addError(errorMsg);
          failedPages++;
          continue;
        }
      }

      // Phase 2: Deep extraction from individual company websites
      if (totalCompaniesForDeepExtraction.length > 0 && !stopRequested.current) {
        addLog('🔍 PHASE 2: Deep extraction from company websites');
        addLog(`📧 Visiting ${totalCompaniesForDeepExtraction.length} company websites for contact extraction`);
        
        setDeepExtractionProgress({ current: 0, total: totalCompaniesForDeepExtraction.length });
        
        for (let i = 0; i < totalCompaniesForDeepExtraction.length; i++) {
          if (stopRequested.current) break;
          
          if (pauseRequested.current) {
            setCurrentStatus('⏸️ Deep extraction paused');
            while (pauseRequested.current && !stopRequested.current) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            if (stopRequested.current) break;
          }

          const company = totalCompaniesForDeepExtraction[i];
          setCurrentlyProcessing(company.companyName);
          setCurrentStatus(`🌐 Visiting ${company.companyName} website for contact details... (${i + 1}/${totalCompaniesForDeepExtraction.length})`);
          
          try {
            // Perform deep extraction
            const enrichedCompany = await scraper.performDeepExtraction(company);
            
            // Convert to lead and add to results
            const lead = convertExtractedToLead(enrichedCompany);
            allLeads.push(lead);
            
            setTotalExtracted(allLeads.length);
            setDeepExtractionProgress({ current: i + 1, total: totalCompaniesForDeepExtraction.length });
            
            // Log enrichment results
            if (enrichedCompany.email || enrichedCompany.phone) {
              addLog(`✅ ${company.companyName}: Found contact info - Email: ${!!enrichedCompany.email}, Phone: ${!!enrichedCompany.phone}`);
            } else {
              addLog(`ℹ️ ${company.companyName}: No contact info found on website`);
            }
            
            // Update progress (50% for directory + 50% for deep extraction)
            setProgress(50 + ((i + 1) / totalCompaniesForDeepExtraction.length) * 50);
            
            // Send incremental updates
            if ((i + 1) % 10 === 0) {
              setAllExtractedLeads([...allLeads]);
              onLeadsExtracted([...allLeads]);
              const enrichedCount = allLeads.filter(lead => lead.enrichedSource).length;
              addLog(`📊 Progress: ${i + 1}/${totalCompaniesForDeepExtraction.length} websites visited, ${enrichedCount} with contact info`);
            }
            
            // Smart rate limiting for website visits
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (error) {
            addLog(`❌ Failed to extract from ${company.companyName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Final results
      setCurrentStatus('🎉 Deep web scraping completed!');
      setCurrentlyProcessing('');
      addLog('=== DEEP SCRAPING COMPLETED ===');
      addLog(`✅ Successfully processed ${successfulPages} directory pages`);
      addLog(`❌ Failed directory pages: ${failedPages}`);
      addLog(`🏢 Total companies found: ${allLeads.length}`);
      addLog(`📧 Companies with email: ${allLeads.filter(lead => lead.email).length}`);
      addLog(`📞 Companies with phone: ${allLeads.filter(lead => lead.phone).length}`);
      addLog(`🎯 Total enriched companies: ${allLeads.filter(lead => lead.enrichedSource).length}`);
      addLog(`📊 Enrichment rate: ${Math.round((allLeads.filter(lead => lead.enrichedSource).length / allLeads.length) * 100)}%`);
      
      // Send final results
      if (allLeads.length > 0) {
        setAllExtractedLeads(allLeads);
        onLeadsExtracted(allLeads);
        const enrichedCount = allLeads.filter(lead => lead.enrichedSource).length;
        toast.success(`🎉 Deep scraping complete! Found ${allLeads.length} companies, ${enrichedCount} with contact details`);
      } else {
        toast.error('No companies were extracted. The website may be protected or structure changed.');
        addError('No data extracted - website may be protected or structure changed');
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setCurrentStatus('❌ Deep scraping failed');
      addError(`Complete scraping failed: ${errorMsg}`);
      toast.error('Deep scraping failed. Check logs for details.');
    } finally {
      setIsRunning(false);
      stopRequested.current = false;
      pauseRequested.current = false;
    }
  };

  const pauseScraping = () => {
    pauseRequested.current = true;
    setIsPaused(true);
    addLog(`Pause requested at page ${currentPage}`);
  };

  const resumeScraping = () => {
    pauseRequested.current = false;
    setIsPaused(false);
    addLog(`Resume requested from page ${currentPage}`);
  };

  const stopScraping = () => {
    stopRequested.current = true;
    setIsRunning(false);
    setCurrentStatus('⏹️ Scraping stopped');
    addLog(`Scraping stopped at page ${currentPage}. Total extracted: ${totalExtracted}`);
    
    if (allExtractedLeads.length > 0) {
      onLeadsExtracted(allExtractedLeads);
      toast.info(`Stopped: ${allExtractedLeads.length} companies extracted and saved`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            AI Deep Web Scraper
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Website + Contact Extraction
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status and Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{currentStatus}</div>
            {isRunning && (
              <div className="flex gap-2">
                <Badge variant="outline">{totalExtracted} Found</Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Page {currentPage}/{totalPages}
                </Badge>
              </div>
            )}
          </div>
          
          {/* Currently Processing Company */}
          {currentlyProcessing && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Eye className="w-4 h-4" />
              <span>Visiting: {currentlyProcessing}</span>
            </div>
          )}
          
          {isRunning && (
            <>
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {deepExtractionProgress.total > 0 
                    ? `Deep extraction: ${deepExtractionProgress.current}/${deepExtractionProgress.total}`
                    : `Processing page ${currentPage} of ${totalPages}`
                  }
                </span>
                <span>{Math.round(progress)}% complete</span>
              </div>
            </>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isRunning ? (
            <Button 
              onClick={startFullScraping} 
              className="bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Deep AI Scraping
            </Button>
          ) : (
            <>
              {!isPaused ? (
                <Button onClick={pauseScraping} variant="outline">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button onClick={resumeScraping} variant="outline">
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button onClick={stopScraping} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop & Save
              </Button>
            </>
          )}
        </div>

        {/* Enhanced Information Alert */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Deep AI Extraction:</strong> This scraper visits each company's website to extract contact details (emails, phones) and works with any B2B directory or business platform.
          </AlertDescription>
        </Alert>

        {/* Enhanced Real-time Stats */}
        {totalExtracted > 0 && (
          <div className="grid grid-cols-4 gap-3 p-4 bg-green-50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{totalExtracted}</div>
              <div className="text-xs text-green-500">Companies Found</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {allExtractedLeads.filter(lead => lead.email).length}
              </div>
              <div className="text-xs text-blue-500">With Email</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">
                {allExtractedLeads.filter(lead => lead.phone).length}
              </div>
              <div className="text-xs text-orange-500">With Phone</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">
                {allExtractedLeads.filter(lead => lead.enrichedSource).length}
              </div>
              <div className="text-xs text-purple-500">Enriched</div>
            </div>
          </div>
        )}

        {/* Live Extraction Logs */}
        {logs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Live Deep Extraction Log</h4>
              <Badge variant="outline">{logs.length} entries</Badge>
            </div>
            <ScrollArea className="h-40 border rounded p-2 bg-gray-50">
              {logs.map((log, index) => (
                <div key={index} className="text-xs font-mono mb-1 text-gray-700">
                  {log}
                </div>
              ))}
            </ScrollArea>
          </div>
        )}

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="border border-red-200 bg-red-50 rounded-md p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h4 className="text-sm font-medium text-red-700">Issues Encountered ({errors.length})</h4>
            </div>
            <ScrollArea className="h-20">
              {errors.slice(-5).map((error, index) => (
                <div key={index} className="text-xs text-red-600 mb-1">{error}</div>
              ))}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FullWebsiteScraper;
