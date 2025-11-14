import React, { useEffect, useMemo, useState } from "react";
import API from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

// If you're using shadcn/ui Calendar component, uncomment this line:
// import { Calendar } from "@/components/ui/calendar";

/* ---------- helpers ---------- */
const toISODate = (d) => {
  // returns YYYY-MM-DD in local time
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const niceDate = (v) => {
  try {
    return new Date(v).toLocaleDateString();
  } catch {
    return "-";
  }
};

/* ---------- Dashboard ---------- */
export default function AccountsDashboard() {
  const [loading, setLoading] = useState(false);

  // KPIs
  const [employeesCount, setEmployeesCount] = useState(0);
  const [circulars, setCirculars] = useState([]);
  const [leaves, setLeaves] = useState([]);

  // calendar state
  const [selectedDate, setSelectedDate] = useState(() => new Date()); // default today

  const isoSelected = useMemo(() => toISODate(selectedDate), [selectedDate]);

  const fetchEmployees = async () => {
    const res = await API.get("/employee/getEmployees");

    // ✅ Safe length check
    const count = Array.isArray(res.data) ? res.data.length : 0;

    setEmployeesCount(count);
  };

  const fetchCirculars = async () => {
    const res = await API.get("/circulars"); // expect array of circulars
    let list = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
    // sort by created/updated/date desc, then take 5
    list = [...list]
      .sort((a, b) => {
        const ad = new Date(
          a.createdAt || a.updatedAt || a.date || 0
        ).getTime();
        const bd = new Date(
          b.createdAt || b.updatedAt || b.date || 0
        ).getTime();
        return bd - ad;
      })
      .slice(0, 5);
    setCirculars(list);
  };

  const fetchLeavesOnDate = async (iso) => {
    const res = await API.get(`/leaves/on-date/${iso}`);

    const data = Array.isArray(res.data?.data) ? res.data.data : [];

    setLeaves(data);
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchCirculars(),
        fetchLeavesOnDate(isoSelected),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // when date changes, fetch that day’s leaves
    fetchLeavesOnDate(isoSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isoSelected]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts Dashboard</h1>
        <Button onClick={refreshAll} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{employeesCount}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Leaves Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{leaves.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isoSelected}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Recent Circulars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{circulars.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              latest 5 shown below
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Left: Calendar + Leaves | Right: Circulars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar + on-date list (span 2 cols) */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Employees on Leave
            </CardTitle>

            {/* Use shadcn Calendar if available; else fallback to input[type=date] */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 border px-3 py-1 rounded-md text-sm hover:bg-muted">
                  <CalendarIcon className="w-4 h-4" />
                  {selectedDate.toLocaleDateString()}
                </button>
              </PopoverTrigger>

              <PopoverContent className="p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* <input
              type="date"
              className="border rounded-md text-sm px-2 py-1"
              value={isoSelected}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            /> */}
          </CardHeader>

          <CardContent className="space-y-3">
            {leaves.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No employees on leave for <b>{isoSelected}</b>.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border rounded-md">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left">Employee</th>
                      <th className="p-2 text-left">Emp ID</th>
                      <th className="p-2 text-left">Role</th>
                      <th className="p-2 text-left">Department</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">From</th>
                      <th className="p-2 text-left">To</th>
                      <th className="p-2 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((l) => (
                      <tr key={l._id} className="border-t">
                        <td className="p-2">{l.name || "-"}</td>
                        <td className="p-2">{l.employeeId || "-"}</td>
                        <td className="p-2">{l.role || "-"}</td>
                        <td className="p-2">{l.department || "-"}</td>
                        <td className="p-2">{l.leaveType || "-"}</td>
                        <td className="p-2">{niceDate(l.startDate)}</td>
                        <td className="p-2">{niceDate(l.endDate)}</td>
                        <td
                          className="p-2 max-w-[240px] truncate"
                          title={l.reason || ""}>
                          {l.reason || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Circulars */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Recent Circulars</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {circulars.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No circulars found.
              </div>
            )}
            {circulars.map((c) => (
              <div
                key={c._id || c.id}
                className="border rounded-md p-3 bg-muted/30">
                <div className="font-medium">
                  {c.title || c.name || "Untitled"}
                </div>
                {c.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {c.description}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  {niceDate(c.createdAt || c.updatedAt || c.date)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
