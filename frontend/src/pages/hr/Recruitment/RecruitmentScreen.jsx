// src/pages/hr/Recruitment/RecruitmentScreen.jsx
import React, { useEffect, useState } from "react";
import API from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ScheduleInterviewDialog from "../Applications/ScheduleInterviewDialog";

export default function RecruitmentScreen() {
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState({
    totalScheduled: 0,
    today: 0,
    thisWeek: 0,
  });
  const [upcoming, setUpcoming] = useState([]);
  const [days, setDays] = useState(7);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  /* ✅ Load metrics */
  const loadMetrics = async () => {
    const r = await API.get("/recruitment/metrics");
    setMetrics(r.data);
  };

  /* ✅ Load calendar events */
  const loadCalendar = async (startStr, endStr) => {
    const r = await API.get("/recruitment/calendar", {
      params: { from: startStr, to: endStr },
    });
    setEvents(r.data.events || []);
  };

  /* ✅ Load upcoming interviews */
  const loadUpcoming = async (d = days) => {
    const r = await API.get("/recruitment/upcoming", { params: { days: d } });
    setUpcoming(r.data.data || []);
  };

  useEffect(() => {
    loadMetrics();
    loadUpcoming(days);
  }, [days]);

  /* ✅ Load application by ID (required for dialog) */
  const openInterviewDialog = async (id) => {
    try {
      const res = await API.get(`/applications/${id}`);
      setSelectedApp(res.data);
      setShowDialog(true);
    } catch (err) {
      console.error("Failed to load application", err);
      alert("Failed to load application details.");
    }
  };

  /* calendar on date change */
  const handleDatesSet = (arg) => {
    const from = arg.start.toISOString().slice(0, 10);
    const to = arg.end.toISOString().slice(0, 10);
    loadCalendar(from, to);
  };

  return (
    <div className="space-y-6">
      {/* ✅ KPI WIDGETS */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Scheduled (All Time)", value: metrics.totalScheduled },
          { label: "Interviews Today", value: metrics.today },
          { label: "Interviews This Week", value: metrics.thisWeek },
        ].map((w) => (
          <Card key={w.label}>
            <CardHeader>
              <CardTitle className="text-sm">{w.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {w.value}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ✅ INTERVIEW CALENDAR */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Interview Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              height="auto"
              events={events}
              datesSet={handleDatesSet}
              eventClick={(info) => openInterviewDialog(info.event.id)}
            />
          </CardContent>
        </Card>

        {/* ✅ UPCOMING INTERVIEWS LIST */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Upcoming</CardTitle>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={days === 1 ? "" : "outline"}
                onClick={() => setDays(1)}>
                Today
              </Button>
              <Button
                size="sm"
                variant={days === 2 ? "" : "outline"}
                onClick={() => setDays(2)}>
                Tomorrow
              </Button>
              <Button
                size="sm"
                variant={days === 7 ? "" : "outline"}
                onClick={() => setDays(7)}>
                7 Days
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {upcoming.length === 0 && (
              <p className="text-sm text-gray-500">No upcoming interviews.</p>
            )}

            {upcoming.map((a) => (
              <div
                key={a._id}
                className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {a.candidateId?.name} — {a.jobId?.title}
                  </div>

                  <div className="text-xs text-gray-500">
                    {a.interview?.interviewDate
                      ? new Date(a.interview.interviewDate).toLocaleString()
                      : "-"}

                    {a.interview?.interviewer && (
                      <>
                        {" "}
                        • {a.interview.interviewer.firstName}{" "}
                        {a.interview.interviewer.lastName}
                      </>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInterviewDialog(a._id)}>
                  Reschedule
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ✅ SCHEDULE INTERVIEW POPUP */}
      <ScheduleInterviewDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        application={selectedApp}
        onSuccess={() => {
          setShowDialog(false);
          loadMetrics();
          loadUpcoming(days);
        }}
      />
    </div>
  );
}
