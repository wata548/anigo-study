import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Student, Seat, Reservation, Absence } from "../App";
import SeatGrid from "./SeatGrid";

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
  const [isReserving, setIsReserving] = useState(false);

  // 내 예약 정보
  const myReservation = reservations.find(
    (r) => r.student_id === loggedInStudent?.id && r.date === currentDate
  );

  const myAbsence = absences.find(
    (a) => a.student_id === loggedInStudent?.id && a.date === currentDate
  );

  // 🔄 실시간 예약 변경 감지
  useEffect(() => {
    if (!loggedInStudent) return;

    const channel = supabase
      .channel("reservations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `date=eq.${currentDate}`,
        },
        (payload) => {
          console.log("예약 변경 감지:", payload);
          onDataChange();

          if (
            payload.eventType === "INSERT" &&
            selectedSeat === payload.new.seat_id &&
            payload.new.student_id !== loggedInStudent.id
          ) {
            const reservedStudent = students.find(
              (s) => s.id === payload.new.student_id
            );
            alert(
              `⚠️ 선택하신 좌석이 ${
                reservedStudent?.name || "다른 학생"
              }에 의해 예약되었습니다.\n다른 좌석을 선택해주세요.`
            );
            setSelectedSeat("");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate, selectedSeat, loggedInStudent, students, onDataChange]);

  // 🔒 고정좌석 학생이 좌석 클릭 시도 시 경고
  useEffect(() => {
    if (selectedSeat && loggedInStudent?.fixed_seat_id) {
      alert("⚠️ 고정좌석이 배정된 학생은 좌석을 변경할 수 없습니다.");
      setSelectedSeat("");
    }
  }, [selectedSeat, loggedInStudent]);

  if (!loggedInStudent) {
    return (
      <div style={{ padding: "20px" }}>
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  // 🎯 1학년 전용 화면
  if (loggedInStudent.grade === 1) {
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

  // 🔑 고정좌석이 있는지 확인
  const isFixedSeatStudent = !!loggedInStudent.fixed_seat_id;
  const myFixedSeat = isFixedSeatStudent
    ? seats.find((s) => s.id === loggedInStudent.fixed_seat_id)
    : null;

  // 🔒 고정좌석 학생은 좌석 변경 불가 - 전용 화면 표시
  if (isFixedSeatStudent && myFixedSeat) {
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
          🔑 고정좌석 학생 ({loggedInStudent.name} - {loggedInStudent.grade}
          학년 {loggedInStudent.class}반)
        </h2>

        {/* 고정좌석 안내 */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "20px",
            border: "3px solid #5a67d8",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              marginBottom: "15px",
              color: "white",
              fontWeight: "bold",
            }}
          >
            🔑 고정좌석 정보
          </h3>
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "15px",
            }}
          >
            <p
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1F2937",
                textAlign: "center",
              }}
            >
              📍 {myFixedSeat.group}구역 {myFixedSeat.number}번
            </p>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.2)",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <p style={{ lineHeight: "1.8", fontSize: "15px", color: "white" }}>
              ✅ 별도 예약 없이 키오스크에서 바코드를 스캔하면 자동으로 입실
              처리됩니다.
              <br />
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  display: "block",
                  marginTop: "10px",
                  padding: "10px",
                  background: "rgba(239, 68, 68, 0.9)",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                🚫 고정좌석은 절대 변경할 수 없습니다
              </span>
            </p>
          </div>
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
              {myReservation?.check_in_time && (
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

  // 🎯 일반 학생 (고정좌석 없음)
  const handleReservation = async () => {
    if (loggedInStudent.fixed_seat_id) {
      alert("⛔ 고정좌석이 배정된 학생은 좌석을 변경할 수 없습니다.");
      setSelectedSeat("");
      return;
    }

    if (!selectedSeat) {
      alert("좌석을 선택해주세요.");
      return;
    }

    if (isReserving) {
      alert("예약 처리 중입니다. 잠시만 기다려주세요.");
      return;
    }

    // 🔄 예약 변경인 경우 확인
    if (myReservation) {
      const currentSeatInfo = seats.find((s) => s.id === myReservation.seat_id);
      const newSeatInfo = seats.find((s) => s.id === selectedSeat);

      if (
        !confirm(
          `예약을 변경하시겠습니까?\n\n현재: ${currentSeatInfo?.group}구역 ${currentSeatInfo?.number}번\n변경: ${newSeatInfo?.group}구역 ${newSeatInfo?.number}번`
        )
      ) {
        return;
      }
    }

    setIsReserving(true);

    try {
      const { data: latestReservations, error: fetchError } = await supabase
        .from("reservations")
        .select("*, students(*)")
        .eq("date", currentDate)
        .eq("seat_id", selectedSeat);

      if (fetchError) throw fetchError;

      const fixedSeatOwner = students.find(
        (st) => st.fixed_seat_id === selectedSeat
      );

      if (fixedSeatOwner) {
        alert(
          `⛔ 고정좌석입니다.\n\n이 좌석은 ${fixedSeatOwner.name} 학생의 고정좌석입니다.\n\n다른 좌석을 선택해주세요.`
        );
        setSelectedSeat("");
        await onDataChange();
        setIsReserving(false);
        return;
      }

      if (latestReservations && latestReservations.length > 0) {
        const existingReservation = latestReservations[0];
        const reservedStudentName =
          existingReservation.students?.name || "다른 학생";

        alert(
          `⛔ 이미 예약된 좌석입니다.\n\n${reservedStudentName}이(가) 예약한 좌석입니다.\n\n좌석 상태가 업데이트됩니다.\n다른 좌석을 선택해주세요.`
        );
        setSelectedSeat("");
        await onDataChange();
        setIsReserving(false);
        return;
      }

      // 🔄 예약 변경인 경우: 기존 예약 삭제
      if (myReservation) {
        const { error: deleteError } = await supabase
          .from("reservations")
          .delete()
          .eq("id", myReservation.id);

        if (deleteError) throw deleteError;
      }

      const { error: insertError } = await supabase
        .from("reservations")
        .insert([
          {
            student_id: loggedInStudent.id,
            seat_id: selectedSeat,
            date: currentDate,
            status: "예약",
          },
        ])
        .select();

      if (insertError) {
        if (
          insertError.code === "23505" ||
          insertError.message?.includes("duplicate key")
        ) {
          const { data: recheckData } = await supabase
            .from("reservations")
            .select("*, students(*)")
            .eq("date", currentDate)
            .eq("seat_id", selectedSeat);

          const conflictStudent =
            recheckData?.[0]?.students?.name || "다른 학생";

          alert(
            `⛔ 이미 예약된 좌석입니다.\n${conflictStudent}이(가) 먼저 예약했습니다.`
          );
          setSelectedSeat("");
          await onDataChange();
          setIsReserving(false);
          return;
        }

        alert(`❌ 예약에 실패했습니다.\n\n다시 시도해주세요.`);
        setSelectedSeat("");
        await onDataChange();
        setIsReserving(false);
        return;
      }

      if (myReservation) {
        alert("✅ 예약이 변경되었습니다!");
      } else {
        alert("✅ 예약이 완료되었습니다!");
      }
      setSelectedSeat("");
      await onDataChange();
    } catch (error: any) {
      console.error("예약 처리 오류:", error);
      alert(`❌ 예약에 실패했습니다.\n\n다시 시도해주세요.`);
      setSelectedSeat("");
      await onDataChange();
    } finally {
      setIsReserving(false);
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

  const handleSeatClick = async (seatId: string) => {
    if (loggedInStudent.fixed_seat_id) {
      alert("⛔ 고정좌석이 배정된 학생은 좌석을 선택할 수 없습니다.");
      return;
    }

    const { data: seatCheck } = await supabase
      .from("reservations")
      .select("*, students(*)")
      .eq("date", currentDate)
      .eq("seat_id", seatId);

    if (seatCheck && seatCheck.length > 0) {
      const reservedBy = seatCheck[0].students?.name || "다른 학생";
      alert(
        `⚠️ 이미 예약된 좌석입니다.\n\n${reservedBy}이(가) 예약한 좌석입니다.`
      );
      await onDataChange();
      return;
    }

    const fixedOwner = students.find((st) => st.fixed_seat_id === seatId);
    if (fixedOwner) {
      alert(
        `⚠️ 고정좌석입니다.\n\n이 좌석은 ${fixedOwner.name} 학생의 고정좌석입니다.`
      );
      return;
    }

    setSelectedSeat(seatId);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>
        좌석 예약 ({loggedInStudent.name} - {loggedInStudent.grade}학년{" "}
        {loggedInStudent.class}반)
      </h2>

      {myReservation && (
        <div
          style={{
            background: "#D1FAE5",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginBottom: "10px" }}>✅ 예약 완료</h3>
          <p>
            좌석: {seats.find((s) => s.id === myReservation.seat_id)?.group}구역{" "}
            {seats.find((s) => s.id === myReservation.seat_id)?.number}번
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
                fontWeight: "bold",
              }}
            >
              예약 취소
            </button>
          )}
        </div>
      )}

      {myAbsence && (
        <div
          style={{
            background: "#FEF3C7",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginBottom: "10px" }}>✅ 사유 제출 완료</h3>
          <p>{myAbsence.reason}</p>
        </div>
      )}

      {/* 좌석 선택 - 항상 표시 */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "2px solid #3B82F6",
        }}
      >
        <h3 style={{ fontSize: "18px", marginBottom: "20px" }}>📍 좌석 선택</h3>

        <SeatGrid
          seats={seats}
          reservations={reservations}
          currentDate={currentDate}
          grade={loggedInStudent.grade}
          mode="select"
          selectedSeat={selectedSeat}
          onSeatClick={handleSeatClick}
          loggedInStudentId={loggedInStudent.id}
          students={students}
        />

        <button
          onClick={handleReservation}
          disabled={!selectedSeat || isReserving}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "15px",
            background: selectedSeat && !isReserving ? "#10B981" : "#9CA3AF",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: selectedSeat && !isReserving ? "pointer" : "not-allowed",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          {isReserving
            ? "⏳ 예약 처리 중..."
            : myReservation
            ? "예약 변경하기"
            : "예약 하기"}
        </button>
      </div>

      {/* 사유 제출 */}
      {!myAbsence && !myReservation && (
        <div
          style={{
            background: "#F3F4F6",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>📝 미입실 사유 제출</h3>
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
      )}
    </div>
  );
};

export default StudentReservationView;
