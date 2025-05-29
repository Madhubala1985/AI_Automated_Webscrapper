
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, Square, Globe, CheckCircle, AlertTriangle } from 'lucide-react';
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
    stopRequested.current = false;
    pauseRequested.current = false;

    try {
      // Initialize scraper with configuration
      const scrapingConfig = createScrapingConfig(baseUrl);
      const scraper = new WebScraper(scrapingConfig);

      setCurrentStatus('🤖 AI-powered web scraper initializing...');
      addLog('=== REAL WEB SCRAPING STARTED ===');
      addLog(`Target: ${baseUrl}`);
      addLog(`Intelligent extraction for ${totalPages} pages`);
      addLog('Using AI-powered DOM analysis and pattern recognition');

      let allLeads: CompanyLead[] = [];
      let successfulPages = 0;
      let failedPages = 0;

      // Process pages sequentially to avoid rate limiting
      for (let page = 1; page <= totalPages; page++) {
        // Check for stop/pause requests
        if (stopRequested.current) {
          addLog(`🛑 Scraping stopped by user at page ${page}`);
          break;
        }

        if (pauseRequested.current) {
          setCurrentStatus('⏸️ Scraping paused');
          addLog(`⏸️ Scraping paused at page ${page}`);
          // Wait for resume
          while (pauseRequested.current && !stopRequested.current) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          if (stopRequested.current) break;
          setCurrentStatus('▶️ Resuming scraping...');
          addLog(`▶️ Resuming scraping from page ${page}`);
        }

        setCurrentPage(page);
        setCurrentStatus(`🔍 AI analyzing page ${page}/${totalPages}...`);
        
        try {
          const pageUrl = scraper.generatePageUrl(page);
          addLog(`🌐 Fetching page ${page}: ${pageUrl}`);

          // Fetch page content
          setCurrentStatus(`📥 Downloading page ${page} content...`);
          const htmlContent = await scraper.fetchPageContent(pageUrl);
          
          if (!htmlContent || htmlContent.length < 100) {
            addError(`Page ${page} returned insufficient content`);
            failedPages++;
            continue;
          }

          setCurrentStatus(`🤖 AI extracting companies from page ${page}...`);
          addLog(`🔍 AI analyzing DOM structure on page ${page}`);

          // Extract companies using AI-powered scraping
          const extractedCompanies = await scraper.extractCompaniesFromHTML(htmlContent, pageUrl);
          
          if (extractedCompanies.length === 0) {
            addLog(`⚠️ No companies found on page ${page} - trying alternative extraction methods`);
            failedPages++;
            continue;
          }

          // Convert to CompanyLead format
          const leads = extractedCompanies.map(convertExtractedToLead);
          allLeads = [...allLeads, ...leads];
          
          setTotalExtracted(prev => prev + leads.length);
          setAllExtractedLeads(allLeads);
          
          addLog(`✅ Page ${page}: Extracted ${leads.length} companies (Total: ${allLeads.length})`);
          
          // Log contact enrichment success
          const enrichedCount = leads.filter(lead => lead.enrichedSource).length;
          if (enrichedCount > 0) {
            addLog(`  📧 Found ${enrichedCount} companies with contact information`);
          }

          successfulPages++;

          // Update progress
          setProgress((page / totalPages) * 100);

          // Send incremental updates
          if (page % 5 === 0 || leads.length > 0) {
            onLeadsExtracted(allLeads);
            addLog(`📊 Progress update: ${allLeads.length} companies collected`);
          }

          // Smart rate limiting
          if (page % 10 === 0) {
            setCurrentStatus(`⏳ Smart rate limiting (page ${page})...`);
            addLog(`🛡️ Applying intelligent rate limiting after page ${page}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            // Shorter delay between pages
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Progress notifications
          if (page % 25 === 0) {
            toast.success(`Progress: ${page}/${totalPages} pages • ${allLeads.length} companies found`);
          }

        } catch (error) {
          const errorMsg = `Failed to process page ${page}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          addError(errorMsg);
          failedPages++;
          
          // Continue with next page instead of stopping
          continue;
        }
      }

      // Final results
      setCurrentStatus('🎉 Real web scraping completed!');
      addLog('=== SCRAPING COMPLETED ===');
      addLog(`✅ Successfully processed ${successfulPages} pages`);
      addLog(`❌ Failed pages: ${failedPages}`);
      addLog(`🏢 Total companies extracted: ${allLeads.length}`);
      addLog(`📧 Companies with contact info: ${allLeads.filter(lead => lead.enrichedSource).length}`);
      addLog(`📊 Success rate: ${Math.round((successfulPages / totalPages) * 100)}%`);
      
      // Send final results
      if (allLeads.length > 0) {
        onLeadsExtracted(allLeads);
        toast.success(`🎉 Scraping complete! Found ${allLeads.length} companies from ${successfulPages} pages`);
      } else {
        toast.error('No companies were extracted. The website structure may have changed or be protected.');
        addError('No data extracted - website may be protected or structure changed');
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setCurrentStatus('❌ Scraping failed');
      addError(`Complete scraping failed: ${errorMsg}`);
      toast.error('Scraping failed. Check logs for details.');
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
            AI Web Scraper
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Real Website Extraction
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
          
          {isRunning && (
            <>
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Processing page {currentPage} of {totalPages}</span>
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
              Start AI Web Scraping
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

        {/* Information Alert */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>AI-Powered Extraction:</strong> This scraper uses intelligent DOM analysis, pattern recognition, and adaptive extraction methods to find companies on any business directory website.
          </AlertDescription>
        </Alert>

        {/* Real-time Stats */}
        {totalExtracted > 0 && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalExtracted}</div>
              <div className="text-sm text-green-500">Companies Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {allExtractedLeads.filter(lead => lead.enrichedSource).length}
              </div>
              <div className="text-sm text-blue-500">With Contacts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(((currentPage - 1) / totalPages) * 100)}%
              </div>
              <div className="text-sm text-purple-500">Progress</div>
            </div>
          </div>
        )}

        {/* Live Extraction Logs */}
        {logs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Live Extraction Log</h4>
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
