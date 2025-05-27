
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
import { Download, Play, Pause, Stop, Settings, Mail, Users, Building } from 'lucide-react';
import { toast } from 'sonner';
import { CompanyLead, ScrapingSession, EmailTemplate, EnrichmentConfig } from '../types/leadGeneration';

const LeadGenerationWorkflow = () => {
  const [currentSession, setCurrentSession] = useState<ScrapingSession | null>(null);
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
    enableSpacyNER: true,
    enableEmailGeneration: true
  });

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Mock data for demonstration
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
      extractedFrom: 'https://directory.example.com/techcorp',
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
      enrichedSource: false,
      extractedFrom: 'https://directory.example.com/globaltrade',
      lastUpdated: new Date(),
      status: 'extracted'
    }
  ];

  const startLeadGeneration = async () => {
    if (!currentSession) {
      toast.error('Please analyze a website first');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    
    // Simulate the lead generation process
    const steps = [
      'Analyzing website structure...',
      'Handling cookie consent...',
      'Extracting company listings...',
      'Visiting company websites...',
      'Extracting contact information...',
      'Enriching data with external APIs...',
      'Personalizing email content...',
      'Finalizing lead database...'
    ];

    for (let i = 0; i < steps.length; i++) {
      toast.info(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProgress(((i + 1) / steps.length) * 100);
    }

    // Create mock session with results
    const session: ScrapingSession = {
      id: Date.now().toString(),
      url: 'https://example-directory.com',
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
    toast.success('Lead generation completed successfully!');
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
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lead Generation Control Panel
          </CardTitle>
          <CardDescription>
            Automated B2B lead extraction and enrichment workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Button 
              onClick={startLeadGeneration} 
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Processing...' : 'Start Lead Generation'}
            </Button>
            
            {isRunning && (
              <Button variant="outline" onClick={() => setIsRunning(false)}>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={exportToCSV}
              disabled={!currentSession || currentSession.leads.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          {isRunning && (
            <div className="mt-4">
              <Label>Processing Progress</Label>
              <Progress value={progress} className="mt-2" />
              <p className="text-sm text-gray-600 mt-1">{Math.round(progress)}% complete</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration */}
      <Tabs defaultValue="email-template">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email-template">Email Template</TabsTrigger>
          <TabsTrigger value="enrichment">Enrichment</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="email-template">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Personalization Template
              </CardTitle>
              <CardDescription>
                Configure the base email template for personalization
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
                Data Enrichment Configuration
              </CardTitle>
              <CardDescription>
                Configure external APIs and enrichment options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hunter-api">Hunter.io API Key (Optional)</Label>
                <Input
                  id="hunter-api"
                  type="password"
                  value={enrichmentConfig.hunterApiKey || ''}
                  onChange={(e) => setEnrichmentConfig(prev => ({ ...prev, hunterApiKey: e.target.value }))}
                  placeholder="Enter Hunter.io API key for email discovery"
                />
              </div>
              <div>
                <Label htmlFor="clearbit-api">Clearbit API Key (Optional)</Label>
                <Input
                  id="clearbit-api"
                  type="password"
                  value={enrichmentConfig.clearbitApiKey || ''}
                  onChange={(e) => setEnrichmentConfig(prev => ({ ...prev, clearbitApiKey: e.target.value }))}
                  placeholder="Enter Clearbit API key for company enrichment"
                />
              </div>
              <div>
                <Label htmlFor="apollo-api">Apollo API Key (Optional)</Label>
                <Input
                  id="apollo-api"
                  type="password"
                  value={enrichmentConfig.apolloApiKey || ''}
                  onChange={(e) => setEnrichmentConfig(prev => ({ ...prev, apolloApiKey: e.target.value }))}
                  placeholder="Enter Apollo API key for verified emails"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Enrichment Features</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• spaCy NER for extracting names and job titles from text</li>
                  <li>• Hunter.io for domain-based email discovery</li>
                  <li>• Fallback strategies for missing contact information</li>
                  <li>• Common page patterns (/about, /contact, /team)</li>
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
                Lead Generation Results
              </CardTitle>
              <CardDescription>
                {currentSession ? 
                  `Session completed: ${currentSession.totalLeads} leads extracted` : 
                  'No active session'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentSession ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600">Total Leads</div>
                      <div className="text-2xl font-bold text-blue-900">{currentSession.totalLeads}</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600">Successful</div>
                      <div className="text-2xl font-bold text-green-900">{currentSession.successfulExtractions}</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-sm text-red-600">Failed</div>
                      <div className="text-2xl font-bold text-red-900">{currentSession.failedExtractions}</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600">Success Rate</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {Math.round((currentSession.successfulExtractions / currentSession.totalLeads) * 100)}%
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
                        {currentSession.leads.map((lead) => (
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
                  <p className="text-gray-500">No lead generation session active</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Start by analyzing a website and then begin the lead generation process
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadGenerationWorkflow;
