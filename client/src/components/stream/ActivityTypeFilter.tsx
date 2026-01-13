import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, ChevronDown, ChevronUp, Filter } from "lucide-react";

type ActivityType = 'news' | 'book' | 'comment' | 'review' | 'user_action';

interface ActivityTypeFilterProps {
  availableTypes: ActivityType[];
  selectedTypes: ActivityType[];
  onFilterChange: (selectedTypes: ActivityType[]) => void;
  isCollapsible?: boolean;
}

export function ActivityTypeFilter({ 
  availableTypes, 
  selectedTypes, 
  onFilterChange,
  isCollapsible = true 
}: ActivityTypeFilterProps) {
  const { t } = useTranslation(['stream']);
  const [isOpen, setIsOpen] = useState(false);

  // Handle type toggle
  const handleTypeToggle = (type: ActivityType) => {
    // Ensure at least one type remains selected
    if (selectedTypes.length === 1 && selectedTypes.includes(type)) {
      return;
    }

    const newSelectedTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    onFilterChange(newSelectedTypes);
  };

  // Clear all filters - reset to all types selected
  const handleClearFilters = () => {
    onFilterChange(availableTypes);
  };

  // Select all types
  const handleSelectAll = () => {
    onFilterChange(availableTypes);
  };

  const hasActiveFilters = selectedTypes.length < availableTypes.length;
  const allSelected = selectedTypes.length === availableTypes.length;

  const content = (
    <CardContent className="space-y-3 pt-4">
      {/* Activity type checkboxes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:flex md:flex-wrap">
        {availableTypes.map((type) => (
          <div key={type} className="flex items-center space-x-2">
            <Checkbox
              id={`activity-type-${type}`}
              checked={selectedTypes.includes(type)}
              onCheckedChange={() => handleTypeToggle(type)}
              disabled={selectedTypes.length === 1 && selectedTypes.includes(type)}
            />
            <Label
              htmlFor={`activity-type-${type}`}
              className="text-sm font-normal cursor-pointer"
            >
              {t(`stream:activityTypeFilter.${type}`)}
            </Label>
          </div>
        ))}
      </div>

      {/* Info text when all selected */}
      {allSelected && (
        <p className="text-xs text-muted-foreground pt-2">
          {t('stream:activityTypeFilter.infoText')}
        </p>
      )}
    </CardContent>
  );

  if (!isCollapsible) {
    return (
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <h3 className="text-sm font-medium">
                {t('stream:activityTypeFilter.title')}
                {hasActiveFilters && (
                  <span className="ml-2 text-xs text-primary">
                    ({selectedTypes.length})
                  </span>
                )}
              </h3>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8"
              >
                <X className="w-4 h-4 mr-1" />
                {t('stream:activityTypeFilter.clearFilters')}
              </Button>
            )}
          </div>
        </CardHeader>
        {content}
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 hover:bg-transparent">
                <Filter className="w-4 h-4" />
                <h3 className="text-sm font-medium">
                  {t('stream:activityTypeFilter.title')}
                  {hasActiveFilters && (
                    <span className="ml-2 text-xs text-primary">
                      ({selectedTypes.length})
                    </span>
                  )}
                </h3>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8"
              >
                <X className="w-4 h-4 mr-1" />
                {t('stream:activityTypeFilter.clearFilters')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CollapsibleContent>
          {content}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
