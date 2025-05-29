
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RotateCcw, Eye, Play } from 'lucide-react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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
  const [customPage, setCustomPage] = useState('');
  const [currentUrl, setCurrentUrl] = useState(baseUrl);

  // For Lloyd's directory, calculated based on 4552 companies with 20 per page
  const totalPages = baseUrl.includes('ldc.lloyds.com') ? Math.ceil(4552 / 20) : 1000;
  const itemsPerPage = 20;
  
  const generatePageUrl = (page: number) => {
    // For Lloyd's directory, handle pagination parameters
    if (baseUrl.includes('ldc.lloyds.com')) {
      const url = new URL(baseUrl);
      url.searchParams.set('start', ((page - 1) * itemsPerPage).toString());
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

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5; // Show this many page numbers at once
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          isActive={currentPage === 1} 
          onClick={() => navigateToPage(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Add ellipsis if needed
    if (currentPage > maxVisiblePages - 1) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Add pages around current page
    const startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages - 1, currentPage + Math.floor(maxVisiblePages / 2));
    
    for (let i = startPage; i <= endPage; i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last page as they're added separately
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i}
            onClick={() => navigateToPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - maxVisiblePages + 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if we have more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            isActive={currentPage === totalPages}
            onClick={() => navigateToPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

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

        {/* Enhanced Pagination */}
        <Pagination>
          <PaginationContent>
            {currentPage > 1 ? (
              <PaginationItem>
                <PaginationPrevious onClick={() => navigateToPage(currentPage - 1)} />
              </PaginationItem>
            ) : (
              <PaginationItem>
                <span className="inline-flex items-center justify-center gap-1 pl-2.5 h-10 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </span>
              </PaginationItem>
            )}
            
            {renderPaginationItems()}
            
            {currentPage < totalPages ? (
              <PaginationItem>
                <PaginationNext onClick={() => navigateToPage(currentPage + 1)} />
              </PaginationItem>
            ) : (
              <PaginationItem>
                <span className="inline-flex items-center justify-center gap-1 pr-2.5 h-10 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </span>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>

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
