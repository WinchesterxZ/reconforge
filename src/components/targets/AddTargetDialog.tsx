'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';

interface AddTargetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    domains: string[];
    description: string;
    customHeaders: Record<string, string>;
  }) => void;
}

export function AddTargetDialog({ open, onOpenChange, onSubmit }: AddTargetDialogProps) {
  const [name, setName] = useState('');
  const [domains, setDomains] = useState('');
  const [description, setDescription] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !domains.trim()) return;

    setLoading(true);
    try {
      let parsedHeaders: Record<string, string> = {};
      if (customHeaders.trim()) {
        try {
          parsedHeaders = JSON.parse(customHeaders);
        } catch {
          parsedHeaders = {};
        }
      }

      onSubmit({
        name: name.trim(),
        domains: domains.split('\n').map((d) => d.trim()).filter(Boolean),
        description: description.trim(),
        customHeaders: parsedHeaders,
      });

      // Reset form
      setName('');
      setDomains('');
      setDescription('');
      setCustomHeaders('');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Target</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new bug bounty target to start reconnaissance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-foreground">
              Project Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domains" className="text-sm text-foreground">
              Domains
              <span className="text-muted-foreground ml-1">(one per line)</span>
            </Label>
            <Textarea
              id="domains"
              placeholder={"acme.com\napi.acme.com\nadmin.acme.com"}
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm min-h-20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Brief description of the target scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground text-sm min-h-16"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headers" className="text-sm text-foreground">
              Custom Headers
              <span className="text-muted-foreground ml-1">(JSON format, optional)</span>
            </Label>
            <Textarea
              id="headers"
              placeholder={'{"X-Custom-Auth": "token123"}'}
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm min-h-16"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !domains.trim() || loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Target
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
