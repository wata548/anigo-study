import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Student, Seat, Reservation, Absence } from "../App";

interface StudentReservationViewProps {
  loggedInStudent: Student | null;
  students: Student[];
  seats: Seat[];
  reservations: Reservation[];
  absences: Absence[];
  currentDate: string;
  onDataChange: () => void;
}

const StudentReservationView: React.FC<StudentReservationViewProps> = ({
  loggedInStudent,
  students,
  seats,
  reservations,
  absences,
  currentDate,
  onDataChange,
}) => {
  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [absenceReason, setAbsenceReason] = useState("");

  if (!loggedInStudent) {
    return (
      <div style={{ padding: "20px" }}>
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  // 🎯 1학년 전용 화면
  if (loggedInStudent.grade === 1) {
    const myAbsence = absences.find(
      (a) => a.student_id === loggedInStudent.id && a.date === currentDate
    );
    const myReservation = reservations.find(
      (r) => r.student_id === loggedInStudent.id && r.date === currentDate
    );

    const handleAbsenceSubmit = async () => {
      if (!absenceReason.trim()) {
        alert("사유를 입력해주세요.");
        return;
      }

      try {
        const { error } = await supabase.from("absences").insert([
          {
            student_id: loggedInStudent.id,
            date: currentDate,
            reason: absenceReason,
          },
        ]);

        if (error) throw error;

        alert("사유가 제출되었습니다.");
        setAbsenceReason("");
        await onDataChange();
      } catch (error) {
        console.error("사유 제출 오류:", error);
        alert("사유 제출에 실패했습니다.");
      }
    };

    return (
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>
          1학년 학생 현황
        </h2>

        <div
          style={{
            background: "#EFF6FF",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "20px",
            border: "2px solid #3B82F6",
          }}
        >
          <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>
            📌 1학년 안내사항
          </h3>
          <p style={{ lineHeight: "1.8", color: "#1E40AF" }}>
            • 1학년은 <strong>좌석 배정 없이</strong> 입실만 체크합니다
            <br />
            • 키오스크에서 바코드를 스캔하면 자동으로 입실 처리됩니다
            <br />• 미입실 시 아래에서 사유를 제출할 수 있습니다
          </p>
        </div>

        {/* 현재 상태 */}
        <div
          style={{
            background: "#F9FAFB",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>
            📊 오늘의 상태
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
            }}
          >
            <div
              style={{
                padding: "15px",
                background: myReservation ? "#D1FAE5" : "#FEE2E2",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "14px", color: "#666" }}>입실 상태</div>
              <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                {myReservation ? "✓ 입실완료" : "미입실"}
              </div>
              {myReservation && (
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}
                >
                  {myReservation.check_in_time}
                </div>
              )}
            </div>
            <div
              style={{
                padding: "15px",
                background: myAbsence ? "#FEF3C7" : "#F3F4F6",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "14px", color: "#666" }}>사유 제출</div>
              <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                {myAbsence ? "제출완료" : "미제출"}
              </div>
            </div>
          </div>
        </div>

        {/* 사유 제출 */}
        {!myAbsence && !myReservation && (
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
            }}
          >
            <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>
              📝 미입실 사유 제출
            </h3>
            <textarea
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              placeholder="미입실 사유를 입력하세요"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                minHeight: "120px",
                fontSize: "14px",
                resize: "vertical",
              }}
            />
            <button
              onClick={handleAbsenceSubmit}
              disabled={!absenceReason.trim()}
              style={{
                marginTop: "10px",
                padding: "12px 24px",
                background: absenceReason.trim() ? "#3B82F6" : "#9CA3AF",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: absenceReason.trim() ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              사유 제출
            </button>
          </div>
        )}

        {/* 제출된 사유 표시 */}
        {myAbsence && (
          <div
            style={{
              background: "#FEF3C7",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #F59E0B",
            }}
          >
            <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>
              ✓ 제출된 사유
            </h3>
            <p
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "8px",
                lineHeight: "1.6",
              }}
            >
              {myAbsence.reason}
            </p>
          </div>
        )}
      </div>
    );
  }

  // 🎯 2, 3학년 로직 (기존 코드)
  const myReservation = reservations.find(
    (r) => r.student_id === loggedInStudent.id && r.date === currentDate
  );

  const myAbsence = absences.find(
    (a) => a.student_id === loggedInStudent.id && a.date === currentDate
  );

  const myFixedSeat = seats.find((s) => s.student_id === loggedInStudent.id);

  const availableSeats = seats.filter((seat) => {
    if (seat.grade !== loggedInStudent.grade) return false;
    const reserved = reservations.find(
      (r) => r.seat_id === seat.id && r.date === currentDate
    );
    return !reserved;
  });

  const groupedSeats: { [key: string]: typeof availableSeats } = {};
  availableSeats.forEach((seat) => {
    if (!groupedSeats[seat.group]) {
      groupedSeats[seat.group] = [];
    }
    groupedSeats[seat.group].push(seat);
  });

  const handleReservation = async () => {
    if (!selectedSeat) {
      alert("좌석을 선택해주세요.");
      return;
    }

    try {
      const { error } = await supabase.from("reservations").insert([
        {
          student_id: loggedInStudent.id,
          seat_id: selectedSeat,
          date: currentDate,
          status: "예약",
        },
      ]);

      if (error) throw error;

      alert("예약이 완료되었습니다.");
      setSelectedSeat("");
      await onDataChange();
    } catch (error) {
      console.error("예약 오류:", error);
      alert("예약에 실패했습니다.");
    }
  };

  const handleAbsenceSubmit = async () => {
    if (!absenceReason.trim()) {
      alert("사유를 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabase.from("absences").insert([
        {
          student_id: loggedInStudent.id,
          date: currentDate,
          reason: absenceReason,
        },
      ]);

      if (error) throw error;

      alert("사유가 제출되었습니다.");
      setAbsenceReason("");
      await onDataChange();
    } catch (error) {
      console.error("사유 제출 오류:", error);
      alert("사유 제출에 실패했습니다.");
    }
  };

  const cancelReservation = async () => {
    if (!myReservation) return;
    if (!confirm("예약을 취소하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", myReservation.id);

      if (error) throw error;

      alert("예약이 취소되었습니다.");
      await onDataChange();
    } catch (error) {
      console.error("예약 취소 오류:", error);
      alert("예약 취소에 실패했습니다.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>
        좌석 예약 ({loggedInStudent.name} - {loggedInStudent.grade}학년{" "}
        {loggedInStudent.class}반)
      </h2>

      {myFixedSeat && (
        <div
          style={{
            background: "#EFF6FF",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "2px solid #3B82F6",
          }}
        >
          <strong>고정좌석:</strong> {myFixedSeat.type} {myFixedSeat.number}번
        </div>
      )}

      {myReservation ? (
        <div
          style={{
            background: "#D1FAE5",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginBottom: "10px" }}>예약 완료</h3>
          <p>
            좌석: {seats.find((s) => s.id === myReservation.seat_id)?.number}번
          </p>
          <p>상태: {myReservation.status}</p>
          {myReservation.check_in_time && (
            <p>입실 시간: {myReservation.check_in_time}</p>
          )}
          {myReservation.status === "예약" && (
            <button
              onClick={cancelReservation}
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                background: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              예약 취소
            </button>
          )}
        </div>
      ) : myAbsence ? (
        <div
          style={{
            background: "#FEF3C7",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginBottom: "10px" }}>사유 제출 완료</h3>
          <p>{myAbsence.reason}</p>
        </div>
      ) : (
        <>
          <div
            style={{
              background: "#F3F4F6",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ marginBottom: "15px" }}>좌석 선택</h3>
            {Object.entries(groupedSeats).map(([group, groupSeats]) => (
              <div key={group} style={{ marginBottom: "20px" }}>
                <h4 style={{ marginBottom: "10px" }}>
                  {group}그룹 ({groupSeats.length}석 사용 가능)
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
                    gap: "8px",
                  }}
                >
                  {groupSeats.map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => setSelectedSeat(seat.id)}
                      style={{
                        padding: "12px",
                        background:
                          selectedSeat === seat.id ? "#3B82F6" : "white",
                        color: selectedSeat === seat.id ? "white" : "#000",
                        border:
                          selectedSeat === seat.id
                            ? "2px solid #3B82F6"
                            : "1px solid #D1D5DB",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      {seat.number}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={handleReservation}
              disabled={!selectedSeat}
              style={{
                marginTop: "15px",
                padding: "10px 20px",
                background: selectedSeat ? "#10B981" : "#9CA3AF",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: selectedSeat ? "pointer" : "not-allowed",
                fontWeight: "bold",
              }}
            >
              예약하기
            </button>
          </div>

          <div
            style={{
              background: "#F3F4F6",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginBottom: "15px" }}>미입실 사유 제출</h3>
            <textarea
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              placeholder="미입실 사유를 입력하세요"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                minHeight: "100px",
                fontSize: "14px",
              }}
            />
            <button
              onClick={handleAbsenceSubmit}
              disabled={!absenceReason.trim()}
              style={{
                marginTop: "10px",
                padding: "10px 20px",
                background: absenceReason.trim() ? "#F59E0B" : "#9CA3AF",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: absenceReason.trim() ? "pointer" : "not-allowed",
                fontWeight: "bold",
              }}
            >
              사유 제출
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentReservationView;
