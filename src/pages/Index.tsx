
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Search, Code, Settings, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  domElements: {
    selector: string;
    purpose: string;
    type: 'click' | 'extract' | 'wait';
  }[];
  workflow: {
    step: number;
    action: string;
    selector?: string;
    waitTime?: number;
    description: string;
  }[];
  recommendedTool: 'beautifulsoup' | 'selenium' | 'puppeteer' | 'playwright';
  enrichmentNeeded: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

const Index = () => {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeWebsite = async () => {
    if (!url) {
      toast.error('Please enter a URL to analyze');
      return;
    }

    setAnalyzing(true);
    
    // Simulate analysis with realistic delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock analysis result based on the example URL
    const mockResult: AnalysisResult = {
      url,
      siteType: 'dynamic',
      cookieHandling: {
        required: true,
        selector: '.cookie-banner button[data-accept]',
        method: 'click'
      },
      listingBehavior: {
        type: 'paginated',
        containerSelector: '.search-results',
        itemSelector: '.company-listing',
        loadMoreSelector: '.pagination .next'
      },
      extractionTargets: {
        companyName: '.company-name',
        profileLink: '.company-link',
        externalWebsite: '.website-link',
        additionalFields: ['.industry', '.location', '.contact-info']
      },
      challenges: [
        'Requires cookie acceptance',
        'Dynamic content loading',
        'Rate limiting detected',
        'Pagination required'
      ],
      domElements: [
        {
          selector: '.cookie-banner button[data-accept]',
          purpose: 'Accept cookies',
          type: 'click'
        },
        {
          selector: '.search-results .company-listing',
          purpose: 'Extract company listings',
          type: 'extract'
        },
        {
          selector: '.pagination .next',
          purpose: 'Navigate to next page',
          type: 'click'
        },
        {
          selector: '.company-name',
          purpose: 'Extract company name',
          type: 'extract'
        }
      ],
      workflow: [
        {
          step: 1,
          action: 'Navigate to URL',
          description: 'Load the initial page and wait for content'
        },
        {
          step: 2,
          action: 'Handle cookies',
          selector: '.cookie-banner button[data-accept]',
          waitTime: 2000,
          description: 'Accept cookies if banner appears'
        },
        {
          step: 3,
          action: 'Wait for listings',
          selector: '.search-results',
          waitTime: 3000,
          description: 'Wait for company listings to load'
        },
        {
          step: 4,
          action: 'Extract data',
          selector: '.company-listing',
          description: 'Extract company information from current page'
        },
        {
          step: 5,
          action: 'Check pagination',
          selector: '.pagination .next',
          description: 'Check if next page exists and navigate'
        },
        {
          step: 6,
          action: 'Repeat extraction',
          description: 'Repeat steps 3-5 until all pages processed'
        }
      ],
      recommendedTool: 'selenium',
      enrichmentNeeded: true,
      difficulty: 'medium'
    };

    setResult(mockResult);
    setAnalyzing(false);
    toast.success('Website analysis completed!');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'selenium': return <Zap className="w-4 h-4" />;
      case 'puppeteer': return <Code className="w-4 h-4" />;
      case 'playwright': return <Settings className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Globe className="w-10 h-10 text-blue-600" />
            Web Automation Intelligence Agent
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Analyze business directory websites and plan automated lead generation workflows
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Website Analysis
            </CardTitle>
            <CardDescription>
              Enter a business directory URL to analyze its structure and plan your scraping strategy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  placeholder="https://ldc.lloyds.com/market-directory/results?mode=bro&bro=1"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={analyzeWebsite} 
                  disabled={analyzing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze Website'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Overview */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Analysis Overview</span>
                  <Badge className={`${getDifficultyColor(result.difficulty)} text-white`}>
                    {result.difficulty.toUpperCase()} DIFFICULTY
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Site Type</div>
                    <div className="text-lg font-bold text-blue-900">{result.siteType.toUpperCase()}</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Recommended Tool</div>
                    <div className="text-lg font-bold text-green-900 flex items-center gap-2">
                      {getToolIcon(result.recommendedTool)}
                      {result.recommendedTool}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Listing Type</div>
                    <div className="text-lg font-bold text-purple-900">{result.listingBehavior.type}</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="text-sm text-orange-600 font-medium">Enrichment Needed</div>
                    <div className="text-lg font-bold text-orange-900">
                      {result.enrichmentNeeded ? 'YES' : 'NO'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis */}
            <Tabs defaultValue="workflow" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="elements">DOM Elements</TabsTrigger>
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
                <TabsTrigger value="extraction">Extraction</TabsTrigger>
              </TabsList>

              <TabsContent value="workflow">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Automation Workflow</CardTitle>
                    <CardDescription>Step-by-step process for scraping this website</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.workflow.map((step, index) => (
                        <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            {step.step}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{step.action}</h4>
                            <p className="text-gray-600">{step.description}</p>
                            {step.selector && (
                              <code className="text-sm bg-gray-200 px-2 py-1 rounded mt-1 inline-block">
                                {step.selector}
                              </code>
                            )}
                            {step.waitTime && (
                              <span className="text-sm text-orange-600 ml-2">
                                Wait: {step.waitTime}ms
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="elements">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Key DOM Elements</CardTitle>
                    <CardDescription>Important selectors for automation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.domElements.map((element, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                              {element.selector}
                            </code>
                            <p className="text-sm text-gray-600 mt-1">{element.purpose}</p>
                          </div>
                          <Badge variant={element.type === 'click' ? 'default' : element.type === 'extract' ? 'secondary' : 'outline'}>
                            {element.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="challenges">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Potential Challenges</CardTitle>
                    <CardDescription>Issues to consider during implementation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.challenges.map((challenge, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                          <span className="text-orange-800">{challenge}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="extraction">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Data Extraction Targets</CardTitle>
                    <CardDescription>Fields to extract from each company listing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Primary Fields
                          </h4>
                          <div className="space-y-2">
                            <div className="p-2 bg-green-50 rounded">
                              <code className="text-sm">{result.extractionTargets.companyName}</code>
                              <span className="text-sm text-gray-600 ml-2">Company Name</span>
                            </div>
                            <div className="p-2 bg-green-50 rounded">
                              <code className="text-sm">{result.extractionTargets.profileLink}</code>
                              <span className="text-sm text-gray-600 ml-2">Profile Link</span>
                            </div>
                            {result.extractionTargets.externalWebsite && (
                              <div className="p-2 bg-green-50 rounded">
                                <code className="text-sm">{result.extractionTargets.externalWebsite}</code>
                                <span className="text-sm text-gray-600 ml-2">External Website</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Additional Fields</h4>
                          <div className="space-y-2">
                            {result.extractionTargets.additionalFields.map((field, index) => (
                              <div key={index} className="p-2 bg-blue-50 rounded">
                                <code className="text-sm">{field}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {result.enrichmentNeeded && (
                        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-semibold text-purple-900 mb-2">Enrichment Recommendations</h4>
                          <ul className="text-sm text-purple-800 space-y-1">
                            <li>• Use Hunter.io for email discovery</li>
                            <li>• Apply spaCy NER for contact information extraction</li>
                            <li>• Validate website URLs and check accessibility</li>
                            <li>• Cross-reference with LinkedIn for additional data</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
