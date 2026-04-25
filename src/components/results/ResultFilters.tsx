'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { EndpointCategory } from '@/lib/types';

interface ResultFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  statusCode: string;
  onStatusCodeChange: (value: string) => void;
  method: string;
  onMethodChange: (value: string) => void;
  onClear: () => void;
  activeTab: string;
}

const categories: { value: string; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'api', label: 'API' },
  { value: 'js', label: 'JavaScript' },
  { value: 'sensitive', label: 'Sensitive' },
  { value: 'login', label: 'Login' },
  { value: 'admin', label: 'Admin' },
  { value: 'idor', label: 'IDOR' },
  { value: 'interesting', label: 'Interesting' },
  { value: 'upload', label: 'Upload' },
  { value: 'parameter', label: 'Parameter' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' },
];

const statusCodes = [
  { value: 'all', label: 'All Status' },
  { value: '200', label: '200 OK' },
  { value: '201', label: '201 Created' },
  { value: '301', label: '301 Redirect' },
  { value: '403', label: '403 Forbidden' },
  { value: '404', label: '404 Not Found' },
  { value: '500', label: '500 Error' },
];

const methods = [
  { value: 'all', label: 'All Methods' },
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'PATCH', label: 'PATCH' },
];

export function ResultFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  statusCode,
  onStatusCodeChange,
  method,
  onMethodChange,
  onClear,
  activeTab,
}: ResultFiltersProps) {
  const hasFilters = search || category !== 'all' || statusCode !== 'all' || method !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search URLs, domains..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-8 bg-card border-border text-foreground text-sm"
        />
      </div>

      {/* Category filter - only for endpoints */}
      {activeTab !== 'subdomains' && (
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-36 h-8 bg-card border-border text-foreground text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value} className="text-xs">
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Status code filter */}
      <Select value={statusCode} onValueChange={onStatusCodeChange}>
        <SelectTrigger className="w-32 h-8 bg-card border-border text-foreground text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {statusCodes.map((sc) => (
            <SelectItem key={sc.value} value={sc.value} className="text-xs">
              {sc.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Method filter - only for endpoints */}
      {activeTab !== 'subdomains' && (
        <Select value={method} onValueChange={onMethodChange}>
          <SelectTrigger className="w-28 h-8 bg-card border-border text-foreground text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {methods.map((m) => (
              <SelectItem key={m.value} value={m.value} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
