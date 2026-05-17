import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { interviewApi } from "../api/services";
import { Interview } from "../types";

const InterviewRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!roomId) return;
    interviewApi
      .getByRoom(roomId)
      .then((r) => {
        setInterview(r.data.data);
        // Mark as ongoing
        interviewApi.start(r.data.data.id).catch(() => {});
      })
      .catch(() =>
        setError("Interview room not found or you are not authorized."),
      )
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) return <div className="loading">Loading interview room...</div>;
  if (error)
    return (
      <div className="error-msg" style={{ margin: 24 }}>
        {error}
      </div>
    );
  if (!interview) return null;

  const jitsiUrl = `https://meet.jit.si/TESS-${roomId}`;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: "#1a56db",
          color: "white",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <strong>🎥 TESS Interview</strong> — {interview.jobTitle}
        </div>
        <div style={{ fontSize: "0.9rem" }}>
          {interview.studentFullName} & {interview.employerCompanyName}
        </div>
        <a
          href="/"
          className="btn btn-sm"
          style={{
            background: "rgba(255,255,255,0.2)",
            color: "white",
            textDecoration: "none",
            padding: "6px 12px",
            borderRadius: 6,
          }}
        >
          ← Back to Dashboard
        </a>
      </div>
      <iframe
        src={jitsiUrl}
        style={{ flex: 1, border: "none", width: "100%" }}
        allow="camera; microphone; fullscreen; display-capture"
        title="Interview Room"
      />
    </div>
  );
};

export default InterviewRoom;
