
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RotateCcw, Eye, Play } from 'lucide-react';
import { toast } from 'sonner';

interface PaginationControlsProps {
  baseUrl: string;
  onPageChange: (url: string, page: number) => void;
  onExtractPage: (url: string) => void;
  isExtracting: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  baseUrl,
  onPageChange,
  onExtractPage,
  isExtracting
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1000); // Will be detected from website
  const [customPage, setCustomPage] = useState('');
  const [currentUrl, setCurrentUrl] = useState(baseUrl);

  const generatePageUrl = (page: number) => {
    // For Lloyd's directory, handle pagination parameters
    if (baseUrl.includes('ldc.lloyds.com')) {
      const url = new URL(baseUrl);
      url.searchParams.set('start', ((page - 1) * 20).toString());
      return url.toString();
    }
    // Generic pagination handling
    return `${baseUrl}&page=${page}`;
  };

  const navigateToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    const newUrl = generatePageUrl(page);
    setCurrentPage(page);
    setCurrentUrl(newUrl);
    onPageChange(newUrl, page);
    toast.info(`Navigated to page ${page}`);
  };

  const goToCustomPage = () => {
    const page = parseInt(customPage);
    if (isNaN(page) || page < 1 || page > totalPages) {
      toast.error('Please enter a valid page number');
      return;
    }
    navigateToPage(page);
    setCustomPage('');
  };

  const extractCurrentPage = () => {
    onExtractPage(currentUrl);
  };

  // Calculate pages for Lloyd's directory (4552 companies, ~20 per page)
  React.useEffect(() => {
    if (baseUrl.includes('ldc.lloyds.com')) {
      setTotalPages(Math.ceil(4552 / 20)); // ~228 pages
    }
  }, [baseUrl]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Website Navigation</span>
          <Badge variant="outline">
            {baseUrl.includes('ldc.lloyds.com') ? '4552 Companies Available' : 'Navigate Pages'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current URL Display */}
        <div>
          <Label>Current URL</Label>
          <div className="p-2 bg-gray-50 rounded text-sm font-mono break-all">
            {currentUrl}
          </div>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm">Page</span>
            <Badge variant="default">{currentPage}</Badge>
            <span className="text-sm">of {totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Jump to Page */}
        <div className="flex items-center gap-2">
          <Label htmlFor="custom-page">Jump to page:</Label>
          <Input
            id="custom-page"
            type="number"
            placeholder="Page #"
            value={customPage}
            onChange={(e) => setCustomPage(e.target.value)}
            className="w-24"
            min="1"
            max={totalPages}
          />
          <Button onClick={goToCustomPage} size="sm">
            Go
          </Button>
        </div>

        {/* Quick Navigation */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToPage(1)}
            disabled={currentPage === 1}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            First Page
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last Page
          </Button>
        </div>

        {/* Extract Actions */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={extractCurrentPage}
              disabled={isExtracting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              {isExtracting ? 'Extracting...' : 'Extract This Page'}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(currentUrl, '_blank')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Page
            </Button>
          </div>
          <p className="text-xs text-gray-600">
            Extract companies from the current page (~20 companies per page)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaginationControls;
