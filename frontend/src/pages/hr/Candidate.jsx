import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Candidates() {
  const candidates = [
    { id: 1, name: "Ananya Gupta", role: "Frontend Developer" },
    { id: 2, name: "Rahul Mehta", role: "QA Analyst" },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Candidates</h2>
      <div className="space-y-3">
        {candidates.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h4 className="font-semibold">{c.name}</h4>
                <p className="text-sm text-gray-500">{c.role}</p>
              </div>
              <button className="text-blue-600 text-sm font-medium">
                View Profile
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
