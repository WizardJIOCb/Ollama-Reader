import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { useToast } from '../hooks/use-toast';
import { Save, RefreshCw, Info } from 'lucide-react';

interface UserRatingConfig {
  id?: string;
  priorMean: number;
  priorStrength: number;
  confidenceThreshold: number;
  
  // Rater weight config
  raterYoungDays: number;
  raterYoungMult: number;
  raterMediumDays: number;
  raterMediumMult: number;
  raterMatureMult: number;
  raterVerifiedMult: number;
  raterActivityMult: number;
  raterMinReadingMinutes30d: number;
  raterMinBooksAdded30d: number;
  raterWeightCap: number;
  raterWeightFloor: number;
  
  // Text quality weight config
  textEmptyMult: number;
  textShortLength: number;
  textShortMult: number;
  textNormalMaxLength: number;
  textNormalMult: number;
  textLongMult: number;
  textSpamMult: number;
  
  // Likes weight config
  likesEnabled: boolean;
  likesAlpha: number;
  likesCap: number;
  
  // Time decay config
  timeDecayEnabled: boolean;
  timeDecayHalfLifeDays: number;
  timeDecayMinWeight: number;
}

export default function UserRatingSystemSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  
  const [config, setConfig] = useState<UserRatingConfig>({
    priorMean: 7.5,
    priorStrength: 20,
    confidenceThreshold: 30,
    raterYoungDays: 7,
    raterYoungMult: 0.3,
    raterMediumDays: 30,
    raterMediumMult: 0.6,
    raterMatureMult: 1.0,
    raterVerifiedMult: 1.10,
    raterActivityMult: 1.05,
    raterMinReadingMinutes30d: 60,
    raterMinBooksAdded30d: 3,
    raterWeightCap: 1.2,
    raterWeightFloor: 0.2,
    textEmptyMult: 0.85,
    textShortLength: 20,
    textShortMult: 0.6,
    textNormalMaxLength: 1200,
    textNormalMult: 1.0,
    textLongMult: 0.9,
    textSpamMult: 0.3,
    likesEnabled: true,
    likesAlpha: 0.3,
    likesCap: 2.0,
    timeDecayEnabled: false,
    timeDecayHalfLifeDays: 180,
    timeDecayMinWeight: 3.0,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/user-rating-config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setConfig({
            ...data,
            priorMean: Number(data.priorMean),
            priorStrength: Number(data.priorStrength),
            confidenceThreshold: Number(data.confidenceThreshold),
            raterYoungDays: Number(data.raterYoungDays),
            raterYoungMult: Number(data.raterYoungMult),
            raterMediumDays: Number(data.raterMediumDays),
            raterMediumMult: Number(data.raterMediumMult),
            raterMatureMult: Number(data.raterMatureMult),
            raterVerifiedMult: Number(data.raterVerifiedMult),
            raterActivityMult: Number(data.raterActivityMult),
            raterMinReadingMinutes30d: Number(data.raterMinReadingMinutes30d),
            raterMinBooksAdded30d: Number(data.raterMinBooksAdded30d),
            raterWeightCap: Number(data.raterWeightCap),
            raterWeightFloor: Number(data.raterWeightFloor),
            textEmptyMult: Number(data.textEmptyMult),
            textShortLength: Number(data.textShortLength),
            textShortMult: Number(data.textShortMult),
            textNormalMaxLength: Number(data.textNormalMaxLength),
            textNormalMult: Number(data.textNormalMult),
            textLongMult: Number(data.textLongMult),
            textSpamMult: Number(data.textSpamMult),
            likesAlpha: Number(data.likesAlpha),
            likesCap: Number(data.likesCap),
            timeDecayHalfLifeDays: Number(data.timeDecayHalfLifeDays),
            timeDecayMinWeight: Number(data.timeDecayMinWeight),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user rating config:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('Failed to load user rating configuration'),
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/user-rating-config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast({
          title: t('success'),
          description: t('User rating configuration saved successfully'),
        });
      } else {
        throw new Error('Failed to save config');
      }
    } catch (error) {
      console.error('Error saving user rating config:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('Failed to save user rating configuration'),
      });
    } finally {
      setSaving(false);
    }
  };

  const recalculateAllRatings = async () => {
    if (!confirm(t('Are you sure you want to recalculate all user profile ratings? This may take some time.'))) {
      return;
    }

    try {
      setRecalculating(true);
      const response = await fetch('/api/admin/recalculate-user-ratings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: t('success'),
          description: t(`Successfully recalculated ratings for ${result.usersUpdated} users`),
        });
      } else {
        throw new Error('Failed to recalculate ratings');
      }
    } catch (error) {
      console.error('Error recalculating user ratings:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('Failed to recalculate user ratings'),
      });
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t('Loading...')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('User Profile Rating System Configuration')}</CardTitle>
          <CardDescription>
            {t('Configure the algorithm used to calculate user profile ratings from reviews')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Bayesian Parameters */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold flex items-center gap-2">
              <Info className="h-4 w-4" />
              {t('Bayesian Parameters')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priorMean">{t('Prior Mean (μ₀)')}</Label>
                <Input
                  id="priorMean"
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={config.priorMean}
                  onChange={(e) => setConfig({ ...config, priorMean: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  {t('Global average user rating (typically 7.4-7.5)')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priorStrength">{t('Prior Strength (m)')}</Label>
                <Input
                  id="priorStrength"
                  type="number"
                  step="1"
                  min="5"
                  max="100"
                  value={config.priorStrength}
                  onChange={(e) => setConfig({ ...config, priorStrength: parseInt(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  {t('Virtual votes for mean (20-30 recommended)')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidenceThreshold">{t('Confidence Threshold (K)')}</Label>
                <Input
                  id="confidenceThreshold"
                  type="number"
                  step="5"
                  min="10"
                  max="100"
                  value={config.confidenceThreshold}
                  onChange={(e) => setConfig({ ...config, confidenceThreshold: parseInt(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  {t('Weight sum needed for full confidence (30 recommended)')}
                </p>
              </div>
            </div>
          </div>

          {/* Rater Weight Parameters */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold">{t('Rater Trust Weight (Anti-Fraud)')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Young Account (<{days} days)', { days: config.raterYoungDays })}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder={t('Days')}
                    value={config.raterYoungDays}
                    onChange={(e) => setConfig({ ...config, raterYoungDays: parseInt(e.target.value) })}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={t('Weight')}
                    value={config.raterYoungMult}
                    onChange={(e) => setConfig({ ...config, raterYoungMult: parseFloat(e.target.value) })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{t('Weight multiplier for new accounts')}</p>
              </div>

              <div className="space-y-2">
                <Label>{t('Medium Account (<{days} days)', { days: config.raterMediumDays })}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder={t('Days')}
                    value={config.raterMediumDays}
                    onChange={(e) => setConfig({ ...config, raterMediumDays: parseInt(e.target.value) })}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={t('Weight')}
                    value={config.raterMediumMult}
                    onChange={(e) => setConfig({ ...config, raterMediumMult: parseFloat(e.target.value) })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{t('Weight multiplier for medium-age accounts')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="raterMatureMult">{t('Mature Account Weight')}</Label>
                <Input
                  id="raterMatureMult"
                  type="number"
                  step="0.1"
                  value={config.raterMatureMult}
                  onChange={(e) => setConfig({ ...config, raterMatureMult: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">{t('Weight for accounts older than medium days')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="raterVerifiedMult">{t('Verified Bonus')}</Label>
                <Input
                  id="raterVerifiedMult"
                  type="number"
                  step="0.05"
                  value={config.raterVerifiedMult}
                  onChange={(e) => setConfig({ ...config, raterVerifiedMult: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">{t('Additional multiplier for verified users (1.10 = +10%)')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="raterActivityMult">{t('Activity Bonus')}</Label>
                <Input
                  id="raterActivityMult"
                  type="number"
                  step="0.05"
                  value={config.raterActivityMult}
                  onChange={(e) => setConfig({ ...config, raterActivityMult: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">{t('Bonus for active readers (1.05 = +5%)')}</p>
              </div>

              <div className="space-y-2">
                <Label>{t('Activity Thresholds')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder={t('Minutes/30d')}
                    value={config.raterMinReadingMinutes30d}
                    onChange={(e) => setConfig({ ...config, raterMinReadingMinutes30d: parseInt(e.target.value) })}
                  />
                  <Input
                    type="number"
                    placeholder={t('Books/30d')}
                    value={config.raterMinBooksAdded30d}
                    onChange={(e) => setConfig({ ...config, raterMinBooksAdded30d: parseInt(e.target.value) })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{t('Min reading minutes OR books added in 30 days')}</p>
              </div>

              <div className="space-y-2">
                <Label>{t('Weight Limits')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={t('Floor')}
                    value={config.raterWeightFloor}
                    onChange={(e) => setConfig({ ...config, raterWeightFloor: parseFloat(e.target.value) })}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={t('Cap')}
                    value={config.raterWeightCap}
                    onChange={(e) => setConfig({ ...config, raterWeightCap: parseFloat(e.target.value) })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{t('Minimum and maximum rater weight')}</p>
              </div>
            </div>
          </div>

          {/* Text Quality Parameters */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold">{t('Text Quality Weight')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="textEmptyMult">{t('Empty Comment Weight')}</Label>
                <Input
                  id="textEmptyMult"
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="1"
                  value={config.textEmptyMult}
                  onChange={(e) => setConfig({ ...config, textEmptyMult: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">{t('Weight when no comment text provided')}</p>
              </div>

              <div className="space-y-2">
                <Label>{t('Short Comment (<{length} chars)', { length: config.textShortLength })}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder={t('Length')}
                    value={config.textShortLength}
                    onChange={(e) => setConfig({ ...config, textShortLength: parseInt(e.target.value) })}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={t('Weight')}
                    value={config.textShortMult}
                    onChange={(e) => setConfig({ ...config, textShortMult: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textNormalMaxLength">{t('Normal Comment Max Length')}</Label>
                <Input
                  id="textNormalMaxLength"
                  type="number"
                  step="100"
                  value={config.textNormalMaxLength}
                  onChange={(e) => setConfig({ ...config, textNormalMaxLength: parseInt(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">{t('Length threshold for normal vs long comments')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textLongMult">{t('Long Comment Weight')}</Label>
                <Input
                  id="textLongMult"
                  type="number"
                  step="0.1"
                  value={config.textLongMult}
                  onChange={(e) => setConfig({ ...config, textLongMult: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">{t('Weight for very long comments')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textSpamMult">{t('Spam Penalty')}</Label>
                <Input
                  id="textSpamMult"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1"
                  value={config.textSpamMult}
                  onChange={(e) => setConfig({ ...config, textSpamMult: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">{t('Weight multiplier for detected spam')}</p>
              </div>
            </div>
          </div>

          {/* Likes Weight Parameters */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="likesEnabled">{t('Enable Likes Weight')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('Give more weight to helpful comments based on likes')}
                </p>
              </div>
              <Switch
                id="likesEnabled"
                checked={config.likesEnabled}
                onCheckedChange={(checked) => setConfig({ ...config, likesEnabled: checked })}
              />
            </div>

            {config.likesEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="likesAlpha">{t('Likes Coefficient (α)')}</Label>
                  <Input
                    id="likesAlpha"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={config.likesAlpha}
                    onChange={(e) => setConfig({ ...config, likesAlpha: parseFloat(e.target.value) })}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('Controls likes impact (0.2-0.4 recommended)')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="likesCap">{t('Likes Weight Cap')}</Label>
                  <Input
                    id="likesCap"
                    type="number"
                    step="0.5"
                    min="1"
                    max="5"
                    value={config.likesCap}
                    onChange={(e) => setConfig({ ...config, likesCap: parseFloat(e.target.value) })}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('Maximum weight multiplier from likes (2-3 recommended)')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Time Decay Parameters */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="timeDecayEnabled">{t('Enable Time Decay')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('Calculate "Recent" rating with time-based weight decay')}
                </p>
              </div>
              <Switch
                id="timeDecayEnabled"
                checked={config.timeDecayEnabled}
                onCheckedChange={(checked) => setConfig({ ...config, timeDecayEnabled: checked })}
              />
            </div>

            {config.timeDecayEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeDecayHalfLifeDays">{t('Half-Life (days)')}</Label>
                  <Input
                    id="timeDecayHalfLifeDays"
                    type="number"
                    step="10"
                    min="30"
                    max="365"
                    value={config.timeDecayHalfLifeDays}
                    onChange={(e) => setConfig({ ...config, timeDecayHalfLifeDays: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('Days until rating weight drops to 50% (180 recommended)')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeDecayMinWeight">{t('Minimum Weight to Show')}</Label>
                  <Input
                    id="timeDecayMinWeight"
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    value={config.timeDecayMinWeight}
                    onChange={(e) => setConfig({ ...config, timeDecayMinWeight: parseFloat(e.target.value) })}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('Min effective weight to display recent rating')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button onClick={saveConfig} disabled={saving} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              {saving ? t('Saving...') : t('Save Configuration')}
            </Button>
            
            <Button 
              onClick={recalculateAllRatings} 
              disabled={recalculating}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? t('Recalculating...') : t('Recalculate All User Ratings')}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground p-4 border rounded-lg">
            <p className="font-semibold mb-2">{t('Note:')}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('Changes take effect immediately for new rating calculations')}</li>
              <li>{t('Click "Recalculate All User Ratings" to update existing profile ratings')}</li>
              <li>{t('Recalculation may take time for large user databases')}</li>
              <li>{t('Lower rater weights help prevent fake account manipulation')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
