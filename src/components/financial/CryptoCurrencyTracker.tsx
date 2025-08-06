
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, DollarSign, Coins, Plus, RefreshCw } from "lucide-react";
import { formatCurrency } from "../dashboard/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  currentPrice: number;
  priceChange24h: number;
}

interface CurrencyRate {
  symbol: string;
  rate: number;
  change24h: number;
}

export const CryptoCurrencyTracker = () => {
  const { user } = useAuth();
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAsset, setNewAsset] = useState({ symbol: "", amount: "" });

  // Load crypto assets from localStorage on component mount
  useEffect(() => {
    if (user) {
      const savedAssets = localStorage.getItem(`crypto_assets_${user.id}`);
      if (savedAssets) {
        const assets = JSON.parse(savedAssets);
        setCryptoAssets(assets);
        // Update prices for saved assets
        updateAssetPrices(assets);
      }
    }
  }, [user]);

  // Save crypto assets to localStorage whenever they change
  useEffect(() => {
    if (user && cryptoAssets.length > 0) {
      localStorage.setItem(`crypto_assets_${user.id}`, JSON.stringify(cryptoAssets));
    }
  }, [cryptoAssets, user]);

  // Fetch live crypto prices from CoinGecko API
  const fetchCryptoData = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano,polkadot,solana,dogecoin,chainlink,litecoin,binancecoin,ripple&vs_currencies=inr&include_24hr_change=true',
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        bitcoin: { 
          price: Math.round(data.bitcoin?.inr || 8150000),
          change: parseFloat(data.bitcoin?.inr_24h_change?.toFixed(2) || '0')
        },
        ethereum: { 
          price: Math.round(data.ethereum?.inr || 303750),
          change: parseFloat(data.ethereum?.inr_24h_change?.toFixed(2) || '0')
        },
        cardano: { 
          price: parseFloat((data.cardano?.inr || 74.09).toFixed(2)),
          change: parseFloat(data.cardano?.inr_24h_change?.toFixed(2) || '0')
        },
        polkadot: { 
          price: parseFloat((data.polkadot?.inr || 703.63).toFixed(2)),
          change: parseFloat(data.polkadot?.inr_24h_change?.toFixed(2) || '0')
        },
        solana: { 
          price: Math.round(data.solana?.inr || 15743),
          change: parseFloat(data.solana?.inr_24h_change?.toFixed(2) || '0')
        },
        dogecoin: { 
          price: parseFloat((data.dogecoin?.inr || 28.5).toFixed(2)),
          change: parseFloat(data.dogecoin?.inr_24h_change?.toFixed(2) || '0')
        },
        chainlink: { 
          price: Math.round(data.chainlink?.inr || 2456),
          change: parseFloat(data.chainlink?.inr_24h_change?.toFixed(2) || '0')
        },
        litecoin: { 
          price: Math.round(data.litecoin?.inr || 12500),
          change: parseFloat(data.litecoin?.inr_24h_change?.toFixed(2) || '0')
        },
        binancecoin: { 
          price: Math.round(data.binancecoin?.inr || 45000),
          change: parseFloat(data.binancecoin?.inr_24h_change?.toFixed(2) || '0')
        },
        ripple: { 
          price: parseFloat((data.ripple?.inr || 185.5).toFixed(2)),
          change: parseFloat(data.ripple?.inr_24h_change?.toFixed(2) || '0')
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
        solana: { price: 15743, change: 6.3 },
        dogecoin: { price: 28.5, change: -2.1 },
        chainlink: { price: 2456, change: 3.8 },
        litecoin: { price: 12500, change: 1.2 },
        binancecoin: { price: 45000, change: 4.5 },
        ripple: { price: 185.5, change: -1.8 }
      };
    }
  };

  const mockCurrencyData = [
    { symbol: "USD/INR", rate: 83.25, change24h: 0.15 },
    { symbol: "EUR/INR", rate: 90.45, change24h: -0.25 },
    { symbol: "GBP/INR", rate: 105.30, change24h: 0.45 }
  ];

  const updateAssetPrices = async (assets: CryptoAsset[]) => {
    try {
      const cryptoData = await fetchCryptoData();
      
      const updatedAssets = assets.map(asset => {
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
    } catch (error) {
      console.error('Error updating asset prices:', error);
    }
  };

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

  const addCryptoAsset = async () => {
    if (!newAsset.symbol || !newAsset.amount) return;

    try {
      const cryptoData = await fetchCryptoData();
      const realData = cryptoData[newAsset.symbol.toLowerCase() as keyof typeof cryptoData];
      
      if (!realData) return;

      const asset: CryptoAsset = {
        id: Date.now().toString(),
        symbol: newAsset.symbol.toUpperCase(),
        name: newAsset.symbol.charAt(0).toUpperCase() + newAsset.symbol.slice(1),
        amount: Number(newAsset.amount),
        currentPrice: realData.price,
        priceChange24h: realData.change
      };

      setCryptoAssets(prev => [...prev, asset]);
      setNewAsset({ symbol: "", amount: "" });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding crypto asset:', error);
    }
  };

  const removeCryptoAsset = (id: string) => {
    const updatedAssets = cryptoAssets.filter(asset => asset.id !== id);
    setCryptoAssets(updatedAssets);
    
    // Update localStorage
    if (user) {
      if (updatedAssets.length === 0) {
        localStorage.removeItem(`crypto_assets_${user.id}`);
      } else {
        localStorage.setItem(`crypto_assets_${user.id}`, JSON.stringify(updatedAssets));
      }
    }
  };

  useEffect(() => {
    fetchData();
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
                    <option value="dogecoin">Dogecoin (DOGE)</option>
                    <option value="chainlink">Chainlink (LINK)</option>
                    <option value="litecoin">Litecoin (LTC)</option>
                    <option value="binancecoin">Binance Coin (BNB)</option>
                    <option value="ripple">XRP (XRP)</option>
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
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(value)}</p>
                      <div className="flex items-center gap-1">
                        <Badge variant={asset.priceChange24h >= 0 ? "default" : "destructive"}>
                          {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
                        </Badge>
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
