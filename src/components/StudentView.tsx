import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Student, Seat, Reservation, Absence, User } from "../App";
import SeatGrid from "./SeatGrid";

interface StudentViewProps {
  loggedInStudent: Student | null;
  loggedInUser?: User | null;
  students: Student[]; // 🔥 추가
  seats: Seat[];
  reservations: Reservation[];
  absences: Absence[]; // 🔥 추가
  currentDate: string;
  onDataChange: () => void;
  onShowLogin: () => void;
}

const StudentView: React.FC<StudentViewProps> = ({
  loggedInStudent,
  loggedInUser,
  students, // 🔥 추가 - App에서 받음
  seats,
  reservations,
  absences, // 🔥 추가
  currentDate,
  onDataChange,
  onShowLogin,
}) => {
  // 상태 변수
  const [selectedSeatId, setSelectedSeatId] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentReservation, setCurrentReservation] =
    useState<Reservation | null>(null);

  const isAdmin = loggedInUser?.role === "admin";
  const currentStudent = selectedStudent || loggedInStudent;
  const targetGrade = currentStudent?.grade || 3;

  // 🔥 loadStudents 제거 - 이제 props에서 받음
  // useEffect(() => {
  //   if (isAdmin) {
  //     loadStudents();
  //   }
  // }, [isAdmin]);

  // 현재 학생의 예약 상태 로드 및 selectedSeatId 초기화
  useEffect(() => {
    if (currentStudent) {
      const reservation = reservations.find(
        (r) => r.student_id === currentStudent.id && r.date === currentDate
      );
      setCurrentReservation(reservation || null);

      const initialSeatId =
        reservation?.seat_id || currentStudent.fixed_seat_id || "";

      const fixedSeatReservedByOthers = reservations.find(
        (r) =>
          r.seat_id === currentStudent.fixed_seat_id &&
          r.date === currentDate &&
          r.status === "입실완료" &&
          r.student_id !== currentStudent.id
      );

      if (fixedSeatReservedByOthers) {
        setSelectedSeatId("");
      } else {
        setSelectedSeatId(initialSeatId);
      }
    } else {
      setCurrentReservation(null);
      setSelectedSeatId("");
    }
  }, [currentStudent, reservations, currentDate, seats]);

  // 예약/변경 가능 여부 확인
  const isSeatAvailableForReservation = (seatId: string) => {
    const reservation = reservations.find(
      (r) => r.seat_id === seatId && r.date === currentDate
    );

    if (!reservation) return true;

    if (reservation.status === "입실완료") return false;

    return true;
  };

  // 예약/변경 처리
  const handleReservation = async (action: "reserve" | "cancel") => {
    if (!currentStudent) return;

    // 🔒 고정좌석 학생 체크
    if (action === "reserve" && currentStudent.fixed_seat_id) {
      alert("⛔ 고정좌석이 배정된 학생은 좌석을 변경할 수 없습니다.");
      return;
    }

    try {
      if (action === "reserve") {
        if (!selectedSeatId) {
          alert("좌석을 선택해주세요.");
          return;
        }

        // 🔒 다른 학생의 고정좌석 체크
        const fixedSeatOwner = students.find(
          (st) => st.fixed_seat_id === selectedSeatId
        );

        if (fixedSeatOwner) {
          alert(
            `⛔ 이 좌석은 ${fixedSeatOwner.name} 학생의 고정좌석입니다.\n다른 좌석을 선택해주세요.`
          );
          setSelectedSeatId("");
          return;
        }

        if (
          !isSeatAvailableForReservation(selectedSeatId) &&
          currentReservation?.seat_id !== selectedSeatId
        ) {
          alert("선택한 좌석은 이미 입실 완료 상태입니다.");
          return;
        }

        if (currentReservation) {
          const { error } = await supabase
            .from("reservations")
            .update({
              seat_id: selectedSeatId,
              status: "예약",
              check_in_time: null,
            })
            .eq("id", currentReservation.id)
            .select("*");

          if (error) throw error;
          alert("좌석 예약이 변경되었습니다.");
        } else {
          const { error } = await supabase
            .from("reservations")
            .insert([
              {
                student_id: currentStudent.id,
                seat_id: selectedSeatId,
                date: currentDate,
                status: "예약",
              },
            ])
            .select("*");

          if (error) throw error;
          alert("좌석 예약이 완료되었습니다.");
        }
      } else if (action === "cancel") {
        if (!currentReservation) {
          alert("취소할 예약이 없습니다.");
          return;
        }

        if (
          !window.confirm(
            `${currentStudent.name} 학생의 예약을 취소하시겠습니까?`
          )
        )
          return;

        const { error } = await supabase
          .from("reservations")
          .delete()
          .eq("id", currentReservation.id)
          .select("*");

        if (error) throw error;
        alert("좌석 예약이 취소되었습니다.");
        setSelectedSeatId("");
      }

      await onDataChange();
      if (isAdmin && action === "reserve") {
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error("예약 처리 오류:", error);
      alert(`예약 처리에 실패했습니다. 오류: ${error}.`);
    }
  };

  const getReservationStatusText = () => {
    if (currentReservation) {
      const seat = seats.find((s) => s.id === currentReservation.seat_id);
      let seatInfo = "좌석 미지정";
      if (seat) {
        seatInfo = `${seat.type} ${seat.number}번 (${seat.group} 그룹)`;
      }

      switch (currentReservation.status) {
        case "예약":
          return `✅ 예약 상태: ${seatInfo}`;
        case "입실완료":
          return `🚀 입실 완료: ${seatInfo}`;
        case "미입실":
          return `⚠️ 미입실 처리되었습니다.`;
        case "퇴실완료":
          return `🚪 퇴실 완료: ${seatInfo}`;
        default:
          return `현재 상태: ${currentReservation.status}`;
      }
    }
    return "❌ 현재 예약된 좌석이 없습니다.";
  };

  if (!loggedInStudent && (!loggedInUser || loggedInUser.role !== "admin")) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ fontSize: "14px" }}>
          학생 로그인 또는 관리자 권한이 필요합니다.
        </p>
        <button
          onClick={onShowLogin}
          style={{
            marginTop: "15px",
            padding: "12px 25px",
            background: "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          로그인하기
        </button>
      </div>
    );
  }

  if (isAdmin && !currentStudent) {
    return (
      <div style={{ padding: "15px", maxWidth: "1000px", margin: "0 auto" }}>
        <div
          style={{
            background: "#EFF6FF",
            padding: "30px",
            borderRadius: "12px",
            textAlign: "center",
            border: "2px solid #3B82F6",
          }}
        >
          <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>
            학생 예약 관리
          </h2>
          <p style={{ marginBottom: "20px", color: "#6B7280" }}>
            예약을 조회하거나 생성할 학생을 선택하세요
          </p>
          <select
            value=""
            onChange={(e) => {
              const student = students.find((s) => s.id === e.target.value);
              setSelectedStudent(student || null);
            }}
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "15px",
              border: "2px solid #3B82F6",
              borderRadius: "8px",
              fontSize: "16px",
            }}
          >
            <option value="">학생을 선택하세요</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.grade}학년 {s.class}반 {s.number}번 {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (!currentStudent) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>학생 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const selectedSeatObject = seats.find((s) => s.id === selectedSeatId);
  const isFixedSeatReservedByOthers =
    currentStudent.fixed_seat_id &&
    reservations.some(
      (r) =>
        r.seat_id === currentStudent.fixed_seat_id &&
        r.date === currentDate &&
        r.status === "입실완료" &&
        r.student_id !== currentStudent.id
    );

  return (
    <div style={{ padding: "15px", maxWidth: "1000px", margin: "0 auto" }}>
      {isAdmin && (
        <div
          style={{
            background: "#EFF6FF",
            padding: "15px",
            borderRadius: "12px",
            marginBottom: "20px",
            border: "2px solid #3B82F6",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <label style={{ fontWeight: "bold", minWidth: "80px" }}>
              학생 선택:
            </label>
            <select
              value={currentStudent.id}
              onChange={(e) => {
                const student = students.find((s) => s.id === e.target.value);
                setSelectedStudent(student || null);
                setSelectedSeatId("");
              }}
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "10px",
                border: "2px solid #3B82F6",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.grade}학년 {s.class}반 {s.number}번 {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSelectedStudent(null)}
              style={{
                padding: "10px 20px",
                background: "#6B7280",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              학생 목록
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "16px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
        }}
      >
        <h2
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "15px" }}
        >
          {currentStudent.name} 학생 좌석 예약
        </h2>

        <div
          style={{
            background:
              currentReservation?.status === "입실완료"
                ? "#D1FAE5"
                : currentReservation
                ? "#FEF3C7"
                : "#F9FAFB",
            padding: "15px 20px",
            borderRadius: "12px",
            marginBottom: "25px",
            fontWeight: "bold",
            fontSize: "16px",
            color:
              currentReservation?.status === "입실완료"
                ? "#065F46"
                : currentReservation
                ? "#92400E"
                : "#4B5563",
            border: `1px solid ${
              currentReservation?.status === "입실완료"
                ? "#10B981"
                : currentReservation
                ? "#F59E0B"
                : "#E5E7EB"
            }`,
          }}
        >
          {getReservationStatusText()}
        </div>

        {currentStudent.fixed_seat_id &&
          !currentReservation &&
          isFixedSeatReservedByOthers && (
            <div
              style={{
                background: "#FEF2F2",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "15px",
                border: "1px solid #EF4444",
                color: "#991B1B",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              ⚠️ 고정 좌석 ({currentStudent.fixed_seat_id})이 현재 다른 학생에게
              사용 중입니다. 다른 좌석을 선택하거나 잠시 후에 다시 시도해주세요.
            </div>
          )}

        <h3
          style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}
        >
          예약/변경할 좌석 선택
        </h3>

        {/* 🔥 SeatGrid에 students 전달 */}
        <div style={{ marginBottom: "30px" }}>
          <SeatGrid
            seats={seats}
            reservations={reservations}
            currentDate={currentDate}
            grade={targetGrade}
            mode="select"
            onSeatClick={setSelectedSeatId}
            selectedSeat={selectedSeatId}
            loggedInStudentId={currentStudent.id}
            students={students} // 🔥 이 줄 추가!
          />
        </div>

        <div
          style={{
            paddingTop: "20px",
            borderTop: "1px dashed #E5E7EB",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "15px",
            }}
          >
            {selectedSeatId
              ? `선택된 좌석: ${selectedSeatId}`
              : "예약할 좌석을 선택해주세요."}
          </p>
          <div
            style={{ display: "flex", gap: "15px", justifyContent: "center" }}
          >
            <button
              onClick={() => handleReservation("reserve")}
              disabled={
                !selectedSeatId || currentReservation?.status === "입실완료"
              }
              style={{
                padding: "12px 25px",
                background:
                  selectedSeatId && currentReservation?.status !== "입실완료"
                    ? "#3B82F6"
                    : "#D1D5DB",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor:
                  selectedSeatId && currentReservation?.status !== "입실완료"
                    ? "pointer"
                    : "not-allowed",
                fontWeight: "bold",
                fontSize: "16px",
                transition: "background 0.2s",
              }}
            >
              {currentReservation?.status === "예약" ||
              currentReservation?.seat_id !== selectedSeatId
                ? "예약 변경하기"
                : "좌석 예약하기"}
            </button>
            <button
              onClick={() => handleReservation("cancel")}
              disabled={
                !currentReservation ||
                currentReservation.status === "입실완료" ||
                currentReservation.status === "퇴실완료"
              }
              style={{
                padding: "12px 25px",
                background:
                  currentReservation &&
                  currentReservation.status !== "입실완료" &&
                  currentReservation.status !== "퇴실완료"
                    ? "#EF4444"
                    : "#D1D5DB",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor:
                  currentReservation &&
                  currentReservation.status !== "입실완료" &&
                  currentReservation.status !== "퇴실완료"
                    ? "pointer"
                    : "not-allowed",
                fontWeight: "bold",
                fontSize: "16px",
                transition: "background 0.2s",
              }}
            >
              예약 취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentView;
