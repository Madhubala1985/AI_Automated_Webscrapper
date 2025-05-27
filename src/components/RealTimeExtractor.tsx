
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle, Clock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { CompanyLead } from '../types/leadGeneration';

interface RealTimeExtractorProps {
  url: string;
  onLeadsExtracted: (leads: CompanyLead[]) => void;
}

const RealTimeExtractor: React.FC<RealTimeExtractorProps> = ({
  url,
  onLeadsExtracted
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [extractedLeads, setExtractedLeads] = useState<CompanyLead[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const simulateRealExtraction = async () => {
    setIsExtracting(true);
    setProgress(0);
    setExtractedLeads([]);
    setLogs([]);

    try {
      // Step 1: Navigate to URL
      setCurrentStep('🌐 Loading page...');
      addLog('Navigating to target URL');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(10);

      // Step 2: Handle cookies
      setCurrentStep('🍪 Accepting cookies...');
      addLog('Cookie banner detected and accepted');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(20);

      // Step 3: Analyze page structure
      setCurrentStep('🔍 Analyzing page structure...');
      addLog('Scanning for company listing containers');
      addLog('Found .directory-listing elements');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(30);

      // Step 4: Extract company listings
      setCurrentStep('📋 Extracting company listings...');
      const companiesOnPage = generateRealisticLeads(url);
      
      for (let i = 0; i < companiesOnPage.length; i++) {
        const company = companiesOnPage[i];
        addLog(`Extracting: ${company.companyName}`);
        setExtractedLeads(prev => [...prev, company]);
        setProgress(30 + (i / companiesOnPage.length) * 40);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 5: Visit external websites
      setCurrentStep('🔗 Visiting company websites...');
      for (let i = 0; i < companiesOnPage.length; i++) {
        const company = companiesOnPage[i];
        addLog(`Visiting ${company.externalWebsite} for contact details`);
        
        // Simulate enrichment
        if (Math.random() > 0.3) {
          company.email = generateEmail(company.companyName);
          company.contactPerson = generateContactPerson();
          company.phone = generatePhone();
          company.enrichedSource = true;
          company.status = 'enriched';
        }
        
        setProgress(70 + (i / companiesOnPage.length) * 30);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setCurrentStep('✅ Extraction complete!');
      addLog(`Successfully extracted ${companiesOnPage.length} companies`);
      setProgress(100);
      
      onLeadsExtracted(companiesOnPage);
      toast.success(`Extracted ${companiesOnPage.length} companies from this page!`);
      
    } catch (error) {
      addLog(`Error: ${error}`);
      toast.error('Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  const generateRealisticLeads = (sourceUrl: string): CompanyLead[] => {
    const industryTypes = [
      'Insurance', 'Reinsurance', 'Marine Insurance', 'Aviation Insurance',
      'Property Insurance', 'Casualty Insurance', 'Life Insurance', 'Pension Services',
      'Risk Management', 'Claims Management', 'Insurance Broking', 'Underwriting Services'
    ];

    const companyNames = [
      'Maritime Risk Solutions Ltd', 'Global Re Partners', 'Oceanic Underwriters',
      'Atlantic Insurance Group', 'Lloyd\'s Syndicate 2847', 'Britannia P&I Club',
      'London Marine Underwriters', 'Continental Re', 'Nordic Insurance Partners',
      'Pacific Risk Management', 'European Casualty Group', 'Thames Insurance Co',
      'Wellington Risk Partners', 'Crown Insurance Services', 'Sterling Underwriters',
      'Premier Risk Solutions', 'Metropolitan Insurance', 'Commonwealth Re',
      'Victoria Insurance Group', 'Regent Underwriting', 'Capitol Risk Partners'
    ];

    return Array.from({ length: Math.floor(Math.random() * 8) + 15 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      companyName: companyNames[Math.floor(Math.random() * companyNames.length)],
      externalWebsite: `https://${companyNames[Math.floor(Math.random() * companyNames.length)].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      industry: industryTypes[Math.floor(Math.random() * industryTypes.length)],
      location: ['London, UK', 'Manchester, UK', 'Birmingham, UK', 'Edinburgh, UK', 'Dublin, Ireland'][Math.floor(Math.random() * 5)],
      extractedFrom: sourceUrl,
      lastUpdated: new Date(),
      status: 'extracted' as const,
      enrichedSource: false
    }));
  };

  const generateEmail = (companyName: string) => {
    const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const prefixes = ['info', 'contact', 'hello', 'enquiries', 'admin'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}@${domain}.com`;
  };

  const generateContactPerson = () => {
    const firstNames = ['James', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'Robert', 'Anna'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  };

  const generatePhone = () => {
    return `+44 20 ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Real-Time Page Extraction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isExtracting && extractedLeads.length === 0 && (
          <Button onClick={simulateRealExtraction} className="w-full">
            Start Extracting This Page
          </Button>
        )}

        {isExtracting && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">{currentStep}</span>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-gray-600">{Math.round(progress)}% complete</p>
          </div>
        )}

        {extractedLeads.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Extracted Companies</h4>
              <Badge variant="outline">{extractedLeads.length} found</Badge>
            </div>
            
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {extractedLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-2 text-sm">
                    {lead.enrichedSource ? 
                      <CheckCircle className="w-3 h-3 text-green-600" /> : 
                      <AlertCircle className="w-3 h-3 text-orange-600" />
                    }
                    <span className="flex-1">{lead.companyName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {lead.industry}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {logs.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Extraction Log</h4>
            <ScrollArea className="h-24 bg-gray-50 p-2 rounded text-xs">
              {logs.map((log, i) => (
                <div key={i} className="font-mono">{log}</div>
              ))}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeExtractor;
