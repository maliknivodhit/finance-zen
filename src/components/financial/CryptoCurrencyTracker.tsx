import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, DollarSign, Coins, Plus, RefreshCw } from "lucide-react";
import { formatCurrency } from "../dashboard/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  purchase_price: number;
  currentPrice: number;
  priceChange24h: number;
  purchase_date: string;
}

interface CurrencyRate {
  symbol: string;
  rate: number;
  change24h: number;
}

export const CryptoCurrencyTracker = () => {
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAsset, setNewAsset] = useState({ symbol: "", amount: "", purchasePrice: "" });
  const { toast } = useToast();

  // Fetch real crypto prices from CoinGecko API
  const fetchCryptoData = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano,polkadot,solana&vs_currencies=usd&include_24hr_change=true'
      );
      const data = await response.json();
      
      return {
        bitcoin: { 
          price: Math.round(data.bitcoin?.usd * 83.25), // Convert to INR
          change: parseFloat(data.bitcoin?.usd_24h_change?.toFixed(2) || '0')
        },
        ethereum: { 
          price: Math.round(data.ethereum?.usd * 83.25), 
          change: parseFloat(data.ethereum?.usd_24h_change?.toFixed(2) || '0')
        },
        cardano: { 
          price: parseFloat((data.cardano?.usd * 83.25).toFixed(2)), 
          change: parseFloat(data.cardano?.usd_24h_change?.toFixed(2) || '0')
        },
        polkadot: { 
          price: parseFloat((data.polkadot?.usd * 83.25).toFixed(2)), 
          change: parseFloat(data.polkadot?.usd_24h_change?.toFixed(2) || '0')
        },
        solana: { 
          price: Math.round(data.solana?.usd * 83.25), 
          change: parseFloat(data.solana?.usd_24h_change?.toFixed(2) || '0')
        }
      };
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      // Fallback to mock data if API fails
      return {
        bitcoin: { price: 8150000, change: 2.5 },
        ethereum: { price: 303750, change: 1.8 },
        cardano: { price: 74.09, change: 4.1 },
        polkadot: { price: 703.63, change: 2.7 },
        solana: { price: 15743, change: 6.3 }
      };
    }
  };

  const mockCurrencyData = [
    { symbol: "USD/INR", rate: 83.25, change24h: 0.15 },
    { symbol: "EUR/INR", rate: 90.45, change24h: -0.25 },
    { symbol: "GBP/INR", rate: 105.30, change24h: 0.45 }
  ];

  const fetchData = async () => {
    setLoading(true);
    
    try {
      const cryptoData = await fetchCryptoData();
      
      // Update crypto prices with real data
      const updatedAssets = cryptoAssets.map(asset => {
        const realData = cryptoData[asset.symbol.toLowerCase() as keyof typeof cryptoData];
        if (realData) {
          return {
            ...asset,
            currentPrice: realData.price,
            priceChange24h: realData.change
          };
        }
        return asset;
      });
      
      setCryptoAssets(updatedAssets);
      setCurrencyRates(mockCurrencyData);
    } catch (error) {
      console.error('Error updating crypto data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCryptoAssets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('crypto_holdings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const cryptoData = await fetchCryptoData();
      const assetsWithCurrentPrices = data.map(asset => {
        const realData = cryptoData[asset.symbol.toLowerCase() as keyof typeof cryptoData];
        return {
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          amount: Number(asset.amount),
          purchase_price: Number(asset.purchase_price),
          currentPrice: realData?.price || Number(asset.current_price),
          priceChange24h: realData?.change || 0,
          purchase_date: asset.purchase_date
        };
      });

      setCryptoAssets(assetsWithCurrentPrices);
    } catch (error) {
      console.error('Error loading crypto assets:', error);
    }
  };

  const addCryptoAsset = async () => {
    if (!newAsset.symbol || !newAsset.amount || !newAsset.purchasePrice) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "Please log in to add crypto assets" });
        return;
      }

      const cryptoData = await fetchCryptoData();
      const realData = cryptoData[newAsset.symbol.toLowerCase() as keyof typeof cryptoData];
      
      if (!realData) {
        toast({ title: "Error", description: "Cryptocurrency not supported" });
        return;
      }

      const { error } = await supabase
        .from('crypto_holdings')
        .insert({
          user_id: user.id,
          symbol: newAsset.symbol.toUpperCase(),
          name: newAsset.symbol.charAt(0).toUpperCase() + newAsset.symbol.slice(1),
          amount: Number(newAsset.amount),
          purchase_price: Number(newAsset.purchasePrice),
          current_price: realData.price
        });

      if (error) throw error;

      await loadCryptoAssets();
      setNewAsset({ symbol: "", amount: "", purchasePrice: "" });
      setShowAddForm(false);
      toast({ title: "Success", description: "Crypto asset added successfully" });
    } catch (error) {
      console.error('Error adding crypto asset:', error);
      toast({ title: "Error", description: "Failed to add crypto asset" });
    }
  };

  const removeCryptoAsset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crypto_holdings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadCryptoAssets();
      toast({ title: "Success", description: "Crypto asset removed successfully" });
    } catch (error) {
      console.error('Error removing crypto asset:', error);
      toast({ title: "Error", description: "Failed to remove crypto asset" });
    }
  };

  useEffect(() => {
    loadCryptoAssets();
    setCurrencyRates(mockCurrencyData);
  }, []);

  const totalPortfolioValue = cryptoAssets.reduce(
    (total, asset) => total + (asset.amount * asset.currentPrice),
    0
  );

  const totalPortfolioChange = cryptoAssets.length > 0 
    ? cryptoAssets.reduce((total, asset) => total + asset.priceChange24h, 0) / cryptoAssets.length
    : 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Crypto & Currency Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Portfolio Value</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(totalPortfolioValue)}
            </p>
          </div>

          <div className={`p-4 rounded-lg ${totalPortfolioChange >= 0 ? 'bg-success-light' : 'bg-danger-light'}`}>
            <div className="flex items-center gap-2 mb-2">
              {totalPortfolioChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger" />
              )}
              <span className="text-sm font-medium">24h Change</span>
            </div>
            <p className={`text-2xl font-bold ${totalPortfolioChange >= 0 ? 'text-success' : 'text-danger'}`}>
              {totalPortfolioChange >= 0 ? '+' : ''}{totalPortfolioChange.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Cryptocurrency Holdings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Cryptocurrency Holdings</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Asset
              </Button>
            </div>
          </div>

          {showAddForm && (
            <div className="mb-4 p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="crypto-symbol">Cryptocurrency</Label>
                  <select
                    id="crypto-symbol"
                    className="w-full p-2 border border-input rounded-md bg-background"
                    value={newAsset.symbol}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, symbol: e.target.value }))}
                  >
                    <option value="">Select Cryptocurrency</option>
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="ethereum">Ethereum (ETH)</option>
                    <option value="cardano">Cardano (ADA)</option>
                    <option value="polkadot">Polkadot (DOT)</option>
                    <option value="solana">Solana (SOL)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="crypto-amount">Amount</Label>
                  <Input
                    id="crypto-amount"
                    type="number"
                    step="0.001"
                    value={newAsset.amount}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="purchase-price">Purchase Price (₹)</Label>
                <Input
                  id="purchase-price"
                  type="number"
                  step="0.01"
                  value={newAsset.purchasePrice}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, purchasePrice: e.target.value }))}
                  placeholder="Purchase price per coin"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addCryptoAsset} size="sm">Add Asset</Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {cryptoAssets.length > 0 ? (
              cryptoAssets.map(asset => {
                const value = asset.amount * asset.currentPrice;
                return (
                  <div 
                    key={asset.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <Coins className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{asset.name} ({asset.symbol})</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.amount} {asset.symbol} • {formatCurrency(asset.currentPrice)}/coin
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bought at: {formatCurrency(asset.purchase_price)}/coin
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(value)}</p>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={asset.priceChange24h >= 0 ? "default" : "destructive"}>
                          {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
                        </Badge>
                        {(() => {
                          const profit = (asset.currentPrice - asset.purchase_price) * asset.amount;
                          const profitPercent = ((asset.currentPrice - asset.purchase_price) / asset.purchase_price) * 100;
                          return (
                            <p className={`text-xs ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                              P&L: {profit >= 0 ? '+' : ''}{formatCurrency(profit)} ({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%)
                            </p>
                          );
                        })()}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCryptoAsset(asset.id)}
                          className="ml-2 h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Coins className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No cryptocurrency holdings</p>
                <p className="text-sm">Add assets to track your portfolio</p>
              </div>
            )}
          </div>
        </div>

        {/* Currency Exchange Rates */}
        <div>
          <h4 className="font-semibold mb-4">Currency Exchange Rates</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currencyRates.map(rate => (
              <div key={rate.symbol} className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{rate.symbol}</span>
                  <Badge variant={rate.change24h >= 0 ? "default" : "destructive"}>
                    {rate.change24h >= 0 ? '+' : ''}{rate.change24h.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-xl font-bold">₹{rate.rate.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Net Worth Impact */}
        {cryptoAssets.length > 0 && (
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Portfolio Impact on Net Worth</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Crypto portfolio value: {formatCurrency(totalPortfolioValue)}</p>
              <p>• Include this in your total net worth calculations</p>
              <p>• Consider crypto as a high-risk, high-reward asset class</p>
              <p>• Recommended allocation: 5-10% of total portfolio</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};