import React, { useState } from 'react';
import { useCropStore } from '@/stores/cropStore';
import { CropImage } from '@/components/CropImage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Users, AlertTriangle, Lightbulb } from 'lucide-react';

export const CropNeighborFinder = () => {
  const [inputCrop, setInputCrop] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const { getCropNeighborRecommendations, t } = useCropStore();

  const handleSearch = () => {
    if (!inputCrop.trim()) return;
    
    const result = getCropNeighborRecommendations(inputCrop);
    setRecommendation(result);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-md mx-auto mb-6">
      <Card className="shadow-earth">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            {t('multicroppingAI')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('selectCrop')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`${t('selectCrop')} (${t('tomato')}, ${t('beans')}, ${t('corn')})`}
                  value={inputCrop}
                  onChange={(e) => setInputCrop(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
                <Button 
                  onClick={handleSearch}
                  disabled={!inputCrop.trim()}
                  variant="crop"
                  size="sm"
                >
                  {t('findCompatible')}
                </Button>
            </div>

            {/* Results */}
            {recommendation === null && inputCrop && (
              <div className="text-center py-4 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click "{t('findCompatible')}" to get companion recommendations</p>
              </div>
            )}

            {recommendation === null && !inputCrop && (
              <div className="text-center py-4 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('selectCrop')}</p>
                <p className="text-xs mt-1">Based on Philippine companion planting principles</p>
              </div>
            )}

            {recommendation && (
              <div className="space-y-4">
                {/* Family Info */}
                <div className="text-center">
                  <Badge variant="outline" className="text-sm">
                    {recommendation.familyInfo}
                  </Badge>
                </div>

                <Separator />

                {/* Good Neighbors */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-600">
                    <Users className="h-4 w-4" />
                    {t('goodNeighbors')} ({recommendation.recommendedNeighbors.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {recommendation.recommendedNeighbors.slice(0, 4).map((neighbor, index) => (
                      <CropImage
                        key={index}
                        cropName={neighbor}
                        showDetails
                        className="hover:shadow-sm transition-shadow"
                      />
                    ))}
                  </div>
                </div>

                {/* Bad Neighbors */}
                {recommendation.avoidNeighbors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      {t('avoidNeighbors')} ({recommendation.avoidNeighbors.length})
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {recommendation.avoidNeighbors.slice(0, 3).map((neighbor, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg border border-destructive/20 bg-destructive/5">
                          <CropImage cropName={neighbor} size="sm" />
                          <div className="flex-1">
                            <p className="font-medium text-sm text-destructive">{t(neighbor.toLowerCase()) || neighbor}</p>
                            <p className="text-xs text-muted-foreground">Avoid planting together</p>
                          </div>
                          <span className="text-destructive">⚠️</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Benefits */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-accent" />
                    {t('neighborBenefits')}
                  </h4>
                  <div className="space-y-1">
                    {recommendation.benefits.map((benefit, index) => (
                      <div key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Search Again */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setInputCrop('');
                    setRecommendation(null);
                  }}
                >
                  {t('selectCrop')}
                </Button>
              </div>
            )}

            {recommendation === false && (
              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-2">
                  No companion data found for "{inputCrop}"
                </p>
                <p className="text-xs text-muted-foreground">
                  Try searching for: {t('tomato')}, {t('beans')}, {t('corn')}, {t('lettuce')}, {t('onion')}, {t('cucumber')}, {t('cabbage')}, etc.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};