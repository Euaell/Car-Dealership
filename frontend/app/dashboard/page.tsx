'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  CalendarIcon, CarIcon, CogIcon, DollarSignIcon, 
  PackageIcon, ShoppingCartIcon, UsersIcon, AlertTriangleIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import useStore from '../../lib/store';

// Mock data for initial development - will be replaced with API calls
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

const DashboardPage = () => {
  const router = useRouter();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [upcomingData, setUpcomingData] = useState(null);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    // Redirect if not logged in or not admin/staff
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
      router.push('/');
      return;
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch summary data
        const summaryResponse = await fetch('/api/dashboard/summary', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (summaryResponse.ok) {
          const summaryResult = await summaryResponse.json();
          setSummaryData(summaryResult.data);
        }
        
        // Fetch sales data
        const salesResponse = await fetch(`/api/dashboard/sales?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (salesResponse.ok) {
          const salesResult = await salesResponse.json();
          setSalesData(salesResult.data);
        }
        
        // Fetch inventory data
        const inventoryResponse = await fetch('/api/dashboard/inventory', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (inventoryResponse.ok) {
          const inventoryResult = await inventoryResponse.json();
          setInventoryData(inventoryResult.data);
        }
        
        // Fetch upcoming activities
        const upcomingResponse = await fetch('/api/dashboard/upcoming', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (upcomingResponse.ok) {
          const upcomingResult = await upcomingResponse.json();
          setUpcomingData(upcomingResult.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, router, period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Format time
  const formatTime = (dateString) => {
    return format(new Date(dateString), 'h:mm a');
  };

  // Render loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant={period === 'daily' ? 'default' : 'outline'} 
            onClick={() => handlePeriodChange('daily')}
          >
            Daily
          </Button>
          <Button 
            variant={period === 'weekly' ? 'default' : 'outline'} 
            onClick={() => handlePeriodChange('weekly')}
          >
            Weekly
          </Button>
          <Button 
            variant={period === 'monthly' ? 'default' : 'outline'} 
            onClick={() => handlePeriodChange('monthly')}
          >
            Monthly
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales & Revenue</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {summaryData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cars Summary */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Cars</CardTitle>
                    <CarIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryData.cars.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {summaryData.cars.available} available, {summaryData.cars.sold} sold recently
                    </p>
                  </CardContent>
                </Card>

                {/* Spare Parts Summary */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Spare Parts</CardTitle>
                    <CogIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryData.spareParts.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {summaryData.spareParts.lowStock} low stock items
                    </p>
                  </CardContent>
                </Card>

                {/* Orders Summary */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Orders</CardTitle>
                    <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summaryData.orders.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {summaryData.orders.pending} pending orders
                    </p>
                  </CardContent>
                </Card>

                {/* Revenue Summary */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summaryData.orders.revenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      Avg. {formatCurrency(summaryData.orders.avgOrderValue)} per order
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Services Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Service Appointments</CardTitle>
                    <CardDescription>
                      {summaryData.services.scheduled} scheduled, {summaryData.services.completed} completed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingData && upcomingData.upcomingServices && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Upcoming Services</h3>
                        {upcomingData.upcomingServices.length > 0 ? (
                          <ul className="space-y-2">
                            {upcomingData.upcomingServices.slice(0, 3).map((service) => (
                              <li key={service.id} className="text-sm border-l-2 border-primary pl-2">
                                <div className="font-medium">
                                  {service.car.make} {service.car.model} ({service.car.year})
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(service.scheduledDate)} at {formatTime(service.scheduledDate)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No upcoming services</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Users Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                      {summaryData.users.total} total, {summaryData.users.new} new users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingData && upcomingData.recentActivities && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Recent Activities</h3>
                        {upcomingData.recentActivities.length > 0 ? (
                          <ul className="space-y-2">
                            {upcomingData.recentActivities.slice(0, 3).map((activity, index) => (
                              <li key={index} className="text-sm border-l-2 border-primary pl-2">
                                <div className="font-medium">
                                  {activity.userName} - {activity.description}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(activity.date)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No recent activities</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Sales & Revenue Tab */}
        <TabsContent value="sales" className="space-y-4">
          {salesData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Car Sales</CardTitle>
                    <CardDescription>
                      Total: {formatCurrency(salesData.totalRevenue.cars)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData.carSales.labels.map((label, index) => ({
                        name: label,
                        value: salesData.carSales.counts[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0088FE" name="Cars Sold" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Spare Parts Sales</CardTitle>
                    <CardDescription>
                      Total: {formatCurrency(salesData.totalRevenue.spareParts)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData.sparePartSales.labels.map((label, index) => ({
                        name: label,
                        value: salesData.sparePartSales.counts[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#00C49F" name="Parts Sold" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Service Revenue</CardTitle>
                    <CardDescription>
                      Total: {formatCurrency(salesData.totalRevenue.services)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData.serviceRevenue.labels.map((label, index) => ({
                        name: label,
                        value: salesData.serviceRevenue.revenue[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#FFBB28" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Total Revenue Trend</CardTitle>
                  <CardDescription>
                    Combined revenue from all sources
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData.carSales.labels.map((label, index) => ({
                      name: label,
                      cars: salesData.carSales.revenue[index] || 0,
                      parts: salesData.sparePartSales.revenue[index] || 0,
                      services: salesData.serviceRevenue.revenue[index] || 0,
                      total: (salesData.carSales.revenue[index] || 0) + 
                             (salesData.sparePartSales.revenue[index] || 0) + 
                             (salesData.serviceRevenue.revenue[index] || 0)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="cars" stroke="#0088FE" name="Cars" />
                      <Line type="monotone" dataKey="parts" stroke="#00C49F" name="Spare Parts" />
                      <Line type="monotone" dataKey="services" stroke="#FFBB28" name="Services" />
                      <Line type="monotone" dataKey="total" stroke="#FF8042" name="Total" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {inventoryData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Cars by Status</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={inventoryData.cars.byStatus}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ status, count }) => `${status}: ${count}`}
                        >
                          {inventoryData.cars.byStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cars by Type</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={inventoryData.cars.byType}
                          dataKey="count"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ type, count }) => `${type}: ${count}`}
                        >
                          {inventoryData.cars.byType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Low Stock Spare Parts</CardTitle>
                  <CardDescription>
                    Parts that need to be restocked soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Part Number</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Min Stock</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryData.spareParts.lowStock.map((part) => (
                        <TableRow key={part.id}>
                          <TableCell className="font-medium">{part.name}</TableCell>
                          <TableCell>{part.partNumber}</TableCell>
                          <TableCell>{part.category}</TableCell>
                          <TableCell>{part.stock}</TableCell>
                          <TableCell>{part.minStockLevel}</TableCell>
                          <TableCell>
                            <Badge variant={part.stock === 0 ? "destructive" : "warning"}>
                              {part.stock === 0 ? "Out of Stock" : "Low Stock"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Spare Parts</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Part Number</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Total Sold</TableHead>
                        <TableHead>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryData.spareParts.topSelling.map((part) => (
                        <TableRow key={part.id}>
                          <TableCell className="font-medium">{part.name}</TableCell>
                          <TableCell>{part.partNumber}</TableCell>
                          <TableCell>{part.category}</TableCell>
                          <TableCell>{part.totalSold}</TableCell>
                          <TableCell>{formatCurrency(part.totalRevenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          {upcomingData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Service Appointments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Vehicle</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingData.upcomingServices.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>
                              {formatDate(service.scheduledDate)}
                              <div className="text-xs text-muted-foreground">
                                {formatTime(service.scheduledDate)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {service.user.name}
                              <div className="text-xs text-muted-foreground">
                                {service.user.phone}
                              </div>
                            </TableCell>
                            <TableCell>
                              {service.car.make} {service.car.model} ({service.car.year})
                              <div className="text-xs text-muted-foreground">
                                {service.car.licensePlate}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pending Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingData.pendingOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              {order.orderNumber}
                            </TableCell>
                            <TableCell>{order.user.name}</TableCell>
                            <TableCell>{formatDate(order.createdAt)}</TableCell>
                            <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingData.recentActivities.map((activity, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(activity.date)}</TableCell>
                          <TableCell>{activity.userName}</TableCell>
                          <TableCell>
                            <Badge variant={activity.type === 'order' ? 'default' : 'secondary'}>
                              {activity.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{activity.reference}</TableCell>
                          <TableCell>{activity.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage; 