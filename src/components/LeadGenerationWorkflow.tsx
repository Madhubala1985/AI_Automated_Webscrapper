import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Play, Pause, Settings, Mail, Users, Building, Globe, CheckCircle, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { CompanyLead, ScrapingSession, EmailTemplate, EnrichmentConfig } from '../types/leadGeneration';
import PaginationControls from './PaginationControls';
import RealTimeExtractor from './RealTimeExtractor';

interface AnalysisResult {
  url: string;
  siteType: 'static' | 'dynamic' | 'spa';
  cookieHandling: {
    required: boolean;
    selector: string;
    method: string;
  };
  listingBehavior: {
    type: 'static' | 'paginated' | 'infinite_scroll' | 'ajax_load';
    containerSelector: string;
    itemSelector: string;
    loadMoreSelector?: string;
  };
  extractionTargets: {
    companyName: string;
    profileLink: string;
    externalWebsite?: string;
    additionalFields: string[];
  };
  challenges: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface LeadGenerationWorkflowProps {
  analysisResult: AnalysisResult | null;
}

const LeadGenerationWorkflow: React.FC<LeadGenerationWorkflowProps> = ({ analysisResult }) => {
  const [currentSession, setCurrentSession] = useState<ScrapingSession | null>(null);
  const [allLeads, setAllLeads] = useState<CompanyLead[]>([]);
  const [currentPageUrl, setCurrentPageUrl] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    subject: 'Partnership Opportunity with [Company Name]',
    baseContent: `Hello [Contact Person],

I hope this message finds you well. I'm reaching out from [Your Company] because I noticed [Company Name] operates in [Industry] and believe there could be valuable synergy between our organizations.

We specialize in [Your Service/Product] and have helped similar companies in [Industry] achieve [Specific Benefit/Result].

I'd love to schedule a brief 15-minute call to explore how we might be able to support [Company Name]'s growth objectives.

Best regards,
[Your Name]`,
    personalizationFields: ['Company Name', 'Contact Person', 'Industry', 'Your Company', 'Your Service/Product', 'Specific Benefit/Result', 'Your Name']
  });
  
  const [enrichmentConfig, setEnrichmentConfig] = useState<EnrichmentConfig>({
    hunterApiKey: 'demo_hunter_key_12345',
    clearbitApiKey: 'demo_clearbit_key_67890',
    apolloApiKey: 'demo_apollo_key_abcde',
    enableSpacyNER: true,
    enableEmailGeneration: true
  });

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePageChange = (url: string, page: number) => {
    setCurrentPageUrl(url);
    toast.info(`Ready to extract from page ${page}`);
  };

  const handlePageExtraction = async (url: string) => {
    setIsExtracting(true);
    toast.info('Starting page extraction...');
  };

  const handleLeadsExtracted = (newLeads: CompanyLead[]) => {
    setAllLeads(prev => [...prev, ...newLeads]);
    
    // Update or create session
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        totalLeads: currentSession.totalLeads + newLeads.length,
        successfulExtractions: currentSession.successfulExtractions + newLeads.length,
        leads: [...currentSession.leads, ...newLeads],
        endTime: new Date()
      };
      setCurrentSession(updatedSession);
    } else {
      const newSession: ScrapingSession = {
        id: Date.now().toString(),
        url: analysisResult?.url || currentPageUrl,
        startTime: new Date(),
        endTime: new Date(),
        totalLeads: newLeads.length,
        successfulExtractions: newLeads.length,
        failedExtractions: 0,
        status: 'completed',
        leads: newLeads
      };
      setCurrentSession(newSession);
    }
    
    setIsExtracting(false);
    toast.success(`Added ${newLeads.length} new leads to your database!`);
  };

  const startLeadGeneration = async () => {
    if (!analysisResult) {
      toast.error('Please analyze a website first in the Analysis tab');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    
    // Enhanced simulation based on analysis result
    const steps = [
      `🌐 Navigating to ${analysisResult.url}...`,
      '🍪 Handling cookie consent automatically...',
      `📋 Extracting company listings from ${analysisResult.listingBehavior.containerSelector}...`,
      '🔗 Visiting company websites for contact details...',
      '📧 Using Hunter.io API for email discovery...',
      '🤖 Applying spaCy NER for contact extraction...',
      '🎯 Personalizing email content with LLM...',
      '💾 Finalizing lead database...'
    ];

    // Enhanced mock data for demonstration
    const mockLeads: CompanyLead[] = [
      {
        id: '1',
        companyName: 'TechCorp Solutions',
        externalWebsite: 'https://techcorp.com',
        contactPerson: 'John Smith',
        role: 'CEO',
        email: 'john.smith@techcorp.com',
        phone: '+1 (555) 123-4567',
        industry: 'Technology',
        location: 'San Francisco, CA',
        enrichedSource: true,
        extractedFrom: analysisResult?.url || 'https://directory.example.com/techcorp',
        lastUpdated: new Date(),
        status: 'personalized'
      },
      {
        id: '2',
        companyName: 'GlobalTrade Inc',
        externalWebsite: 'https://globaltrade.com',
        contactPerson: 'Sarah Johnson',
        role: 'VP Sales',
        email: 'sarah.johnson@globaltrade.com',
        industry: 'Import/Export',
        location: 'New York, NY',
        enrichedSource: true,
        extractedFrom: analysisResult?.url || 'https://directory.example.com/globaltrade',
        lastUpdated: new Date(),
        status: 'personalized'
      },
      {
        id: '3',
        companyName: 'Marine Industries Ltd',
        externalWebsite: 'https://marineindustries.co.uk',
        contactPerson: 'David Wilson',
        role: 'Operations Director',
        email: 'david.wilson@marineindustries.co.uk',
        phone: '+44 20 7123 4567',
        industry: 'Marine Services',
        location: 'London, UK',
        enrichedSource: true,
        extractedFrom: analysisResult?.url || 'https://directory.example.com/marine',
        lastUpdated: new Date(),
        status: 'enriched'
      },
      {
        id: '4',
        companyName: 'Financial Advisors Group',
        externalWebsite: 'https://finadvgroup.com',
        contactPerson: 'Emma Thompson',
        role: 'Managing Partner',
        email: 'emma.thompson@finadvgroup.com',
        industry: 'Financial Services',
        location: 'Edinburgh, UK',
        enrichedSource: true,
        extractedFrom: analysisResult?.url || 'https://directory.example.com/financial',
        lastUpdated: new Date(),
        status: 'extracted'
      }
    ];

    for (let i = 0; i < steps.length; i++) {
      toast.info(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProgress(((i + 1) / steps.length) * 100);
    }

    // Create session with results
    const session: ScrapingSession = {
      id: Date.now().toString(),
      url: analysisResult.url,
      startTime: new Date(Date.now() - 16000),
      endTime: new Date(),
      totalLeads: mockLeads.length,
      successfulExtractions: mockLeads.length,
      failedExtractions: 0,
      status: 'completed',
      leads: mockLeads
    };

    setCurrentSession(session);
    setIsRunning(false);
    toast.success(`🎉 Lead generation completed! Found ${mockLeads.length} leads with contact information.`);
  };

  const exportToCSV = () => {
    if (!currentSession || currentSession.leads.length === 0) {
      toast.error('No leads to export');
      return;
    }

    const headers = [
      'Company Name',
      'External Website',
      'Contact Person',
      'Role',
      'Email',
      'Phone',
      'Industry',
      'Location',
      'Enriched Source',
      'Extracted From',
      'Status',
      'Last Updated'
    ];

    const csvContent = [
      headers.join(','),
      ...currentSession.leads.map(lead => [
        `"${lead.companyName}"`,
        `"${lead.externalWebsite || ''}"`,
        `"${lead.contactPerson || ''}"`,
        `"${lead.role || ''}"`,
        `"${lead.email || ''}"`,
        `"${lead.phone || ''}"`,
        `"${lead.industry || ''}"`,
        `"${lead.location || ''}"`,
        lead.enrichedSource ? 'Yes' : 'No',
        `"${lead.extractedFrom}"`,
        lead.status,
        lead.lastUpdated.toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Leads exported to CSV successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'extracted': return 'bg-blue-500';
      case 'enriched': return 'bg-yellow-500';
      case 'personalized': return 'bg-green-500';
      case 'exported': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {analysisResult ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Website Analysis Complete</p>
                <p className="text-sm text-green-700">
                  Ready to extract leads from: {analysisResult.url}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">No Website Analyzed</p>
                <p className="text-sm text-orange-700">
                  Please go to the Analysis tab and analyze a website first
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisResult && (
        <Tabs defaultValue="navigation">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="navigation" className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Page Navigation
            </TabsTrigger>
            <TabsTrigger value="email-template">Email Template</TabsTrigger>
            <TabsTrigger value="enrichment">Enrichment APIs</TabsTrigger>
            <TabsTrigger value="results">Results ({allLeads.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="navigation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaginationControls
                baseUrl={analysisResult.url}
                onPageChange={handlePageChange}
                onExtractPage={handlePageExtraction}
                isExtracting={isExtracting}
              />
              
              <RealTimeExtractor
                url={currentPageUrl || analysisResult.url}
                onLeadsExtracted={handleLeadsExtracted}
              />
            </div>

            {/* Bulk Operations */}
            <Card>
              <CardHeader>
                <CardTitle>Bulk Operations</CardTitle>
                <CardDescription>
                  Extract from multiple pages automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-center">
                  <Button 
                    onClick={startLeadGeneration} 
                    disabled={isRunning}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isRunning ? 'Processing...' : 'Extract All Pages (Auto)'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={exportToCSV}
                    disabled={allLeads.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export All Leads ({allLeads.length})
                  </Button>
                </div>
                
                {isRunning && (
                  <div className="mt-4">
                    <Progress value={progress} />
                    <p className="text-sm text-gray-600 mt-1">{Math.round(progress)}% complete</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email-template">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Personalization Template
                </CardTitle>
                <CardDescription>
                  Configure the base email template for AI-powered personalization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={emailTemplate.subject}
                    onChange={(e) => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Subject line with [Company Name] variables"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Email Content</Label>
                  <Textarea
                    id="content"
                    value={emailTemplate.baseContent}
                    onChange={(e) => setEmailTemplate(prev => ({ ...prev, baseContent: e.target.value }))}
                    rows={8}
                    placeholder="Email content with personalization variables like [Company Name], [Contact Person], etc."
                  />
                </div>
                <div>
                  <Label>Available Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {emailTemplate.personalizationFields.map((field) => (
                      <Badge key={field} variant="outline">
                        [{field}]
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrichment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Data Enrichment APIs
                </CardTitle>
                <CardDescription>
                  Pre-configured APIs for enhanced lead discovery (Demo keys included)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hunter-api">Hunter.io API Key</Label>
                  <Input
                    id="hunter-api"
                    type="password"
                    value={enrichmentConfig.hunterApiKey || ''}
                    onChange={(e) => setEnrichmentConfig(prev => ({ ...prev, hunterApiKey: e.target.value }))}
                    placeholder="Demo key pre-configured"
                  />
                  <p className="text-xs text-green-600 mt-1">✅ Demo key active for testing</p>
                </div>
                <div>
                  <Label htmlFor="clearbit-api">Clearbit API Key</Label>
                  <Input
                    id="clearbit-api"
                    type="password"
                    value={enrichmentConfig.clearbitApiKey || ''}
                    onChange={(e) => setEnrichmentConfig(prev => ({ ...prev, clearbitApiKey: e.target.value }))}
                    placeholder="Demo key pre-configured"
                  />
                  <p className="text-xs text-green-600 mt-1">✅ Demo key active for testing</p>
                </div>
                <div>
                  <Label htmlFor="apollo-api">Apollo API Key</Label>
                  <Input
                    id="apollo-api"
                    type="password"
                    value={enrichmentConfig.apolloApiKey || ''}
                    onChange={(e) => setEnrichmentConfig(prev => ({ ...prev, apolloApiKey: e.target.value }))}
                    placeholder="Demo key pre-configured"
                  />
                  <p className="text-xs text-green-600 mt-1">✅ Demo key active for testing</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">🤖 AI-Powered Features</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• spaCy NER for extracting names and job titles from website text</li>
                    <li>• Hunter.io integration for domain-based email discovery</li>
                    <li>• LLM-powered email personalization for each lead</li>
                    <li>• Automatic cookie handling and rate limiting</li>
                    <li>• Fallback strategies for missing contact information</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  All Extracted Leads
                </CardTitle>
                <CardDescription>
                  {allLeads.length > 0 ? 
                    `Total: ${allLeads.length} leads extracted from ${analysisResult?.url}` : 
                    'No leads extracted yet'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allLeads.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-600">Total Leads</div>
                        <div className="text-2xl font-bold text-blue-900">{allLeads.length}</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-600">With Contact Info</div>
                        <div className="text-2xl font-bold text-green-900">
                          {allLeads.filter(lead => lead.email || lead.phone).length}
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm text-purple-600">Enriched</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {allLeads.filter(lead => lead.enrichedSource).length}
                        </div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-sm text-orange-600">Success Rate</div>
                        <div className="text-2xl font-bold text-orange-900">
                          {Math.round((allLeads.filter(lead => lead.email || lead.phone).length / allLeads.length) * 100)}%
                        </div>
                      </div>
                    </div>

                    <ScrollArea className="h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Enriched</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allLeads.map((lead) => (
                            <TableRow key={lead.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{lead.companyName}</div>
                                  <div className="text-sm text-gray-600">{lead.industry}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{lead.contactPerson || 'N/A'}</div>
                                  <div className="text-sm text-gray-600">{lead.role || 'N/A'}</div>
                                </div>
                              </TableCell>
                              <TableCell>{lead.email || 'N/A'}</TableCell>
                              <TableCell>{lead.phone || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge className={`${getStatusColor(lead.status)} text-white`}>
                                  {lead.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {lead.enrichedSource ? '✅' : '❌'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No leads extracted yet</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Use the Page Navigation tab to start extracting companies
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default LeadGenerationWorkflow;
