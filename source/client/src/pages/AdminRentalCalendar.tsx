import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, Plus, CheckCircle, Clock, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminRentalCalendar() {
  const [, navigate] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showNewBookingDialog, setShowNewBookingDialog] = useState(false);
  const [formData, setFormData] = useState({
    equipmentItemId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    company: "",
    rentalStartDate: "",
    rentalEndDate: "",
    notes: "",
  });

  const { data: bookings = [], isLoading, refetch } = trpc.rentalBookings.list.useQuery({ limit: 500 });
  const { data: activeRentals = [] } = trpc.rentalBookings.active.useQuery();
  const { data: upcomingRentals = [] } = trpc.rentalBookings.upcoming.useQuery({ daysAhead: 30 });
  const { data: equipment = [] } = trpc.equipment.list.useQuery();
  
  const createBooking = trpc.rentalBookings.create.useMutation({
    onSuccess: () => {
      toast.success("Rental booking created");
      refetch();
      setShowNewBookingDialog(false);
      setFormData({
        equipmentItemId: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        company: "",
        rentalStartDate: "",
        rentalEndDate: "",
        notes: "",
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteBooking = trpc.rentalBookings.delete.useMutation({
    onSuccess: () => {
      toast.success("Booking deleted");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatus = trpc.rentalBookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Get days in month
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth(selectedMonth) }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth(selectedMonth) }, (_, i) => i);

  // Get bookings for a specific day
  const getBookingsForDay = (day: number) => {
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    return bookings.filter((b) => {
      const start = new Date(b.rentalStartDate);
      const end = new Date(b.rentalEndDate);
      return date >= start && date <= end;
    });
  };

  const handleCreateBooking = () => {
    if (!formData.equipmentItemId || !formData.customerName || !formData.rentalStartDate || !formData.rentalEndDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const startDate = new Date(formData.rentalStartDate);
    const endDate = new Date(formData.rentalEndDate);
    const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    createBooking.mutate({
      equipmentItemId: parseInt(formData.equipmentItemId),
      customerName: formData.customerName,
      customerEmail: formData.customerEmail || undefined,
      customerPhone: formData.customerPhone || undefined,
      company: formData.company || undefined,
      rentalStartDate: startDate,
      rentalEndDate: endDate,
      rentalDays,
      notes: formData.notes || undefined,
    });
  };

  const prevMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  const nextMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));

  const monthYear = selectedMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin")} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Rental Calendar</h1>
          </div>
          <Dialog open={showNewBookingDialog} onOpenChange={setShowNewBookingDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Rental Booking</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Equipment *</label>
                  <select
                    value={formData.equipmentItemId}
                    onChange={(e) => setFormData({ ...formData, equipmentItemId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select equipment...</option>
                    {equipment.map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+852 9832 5789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={formData.rentalStartDate}
                      onChange={(e) => setFormData({ ...formData, rentalStartDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date *</label>
                    <input
                      type="date"
                      value={formData.rentalEndDate}
                      onChange={(e) => setFormData({ ...formData, rentalEndDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any special notes..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateBooking} disabled={createBooking.isPending} className="w-full">
                  {createBooking.isPending ? "Creating..." : "Create Booking"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{monthYear}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={prevMonth}>
                    ← Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    Next →
                  </Button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                {days.map((day) => {
                  const dayBookings = getBookingsForDay(day);
                  return (
                    <div
                      key={day}
                      className="aspect-square border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <div className="text-sm font-semibold mb-1">{day}</div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 2).map((booking) => (
                          <div
                            key={booking.id}
                            className={`text-xs px-1 py-0.5 rounded truncate text-white ${
                              booking.status === "active"
                                ? "bg-green-500"
                                : booking.status === "pending"
                                  ? "bg-blue-500"
                                  : booking.status === "completed"
                                    ? "bg-gray-500"
                                    : "bg-red-500"
                            }`}
                          >
                            {booking.customerName}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-xs text-gray-500">+{dayBookings.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Sidebar: Active & Upcoming */}
          <div className="space-y-6">
            {/* Active Rentals */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-bold">Active Rentals</h3>
                <Badge variant="secondary">{activeRentals.length}</Badge>
              </div>
              <div className="space-y-3">
                {activeRentals.length === 0 ? (
                  <p className="text-sm text-gray-500">No active rentals</p>
                ) : (
                  activeRentals.slice(0, 5).map((rental: any) => (
                    <div key={rental.id} className="text-sm p-2 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium">{rental.customerName}</p>
                      <p className="text-xs text-gray-600">Due: {new Date(rental.rentalEndDate).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Upcoming Rentals */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold">Upcoming (7 days)</h3>
                <Badge variant="secondary">{upcomingRentals.length}</Badge>
              </div>
              <div className="space-y-3">
                {upcomingRentals.length === 0 ? (
                  <p className="text-sm text-gray-500">No upcoming rentals</p>
                ) : (
                  upcomingRentals.slice(0, 5).map((rental: any) => (
                    <div key={rental.id} className="text-sm p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-medium">{rental.customerName}</p>
                      <p className="text-xs text-gray-600">Starts: {new Date(rental.rentalStartDate).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Recent Bookings */}
            <Card className="p-4">
              <h3 className="font-bold mb-4">Recent Bookings</h3>
              <div className="space-y-2">
                {bookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{booking.customerName}</p>
                      <p className="text-xs text-gray-500">{booking.status}</p>
                    </div>
                    <button
                      onClick={() => deleteBooking.mutate({ id: booking.id })}
                      className="p-1 hover:bg-red-100 rounded transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
