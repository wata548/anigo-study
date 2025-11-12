import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Student, Seat, Reservation, User } from "../App";
import SeatGrid from "./SeatGrid";

interface StudentViewProps {
  loggedInStudent: Student | null;
  loggedInUser?: User | null;
  seats: Seat[];
  reservations: Reservation[];
  currentDate: string;
  onDataChange: () => void;
  onShowLogin: () => void;
}

const StudentView: React.FC<StudentViewProps> = ({
  loggedInStudent,
  loggedInUser,
  seats,
  reservations,
  currentDate,
  onDataChange,
  onShowLogin,
}) => {
  // 상태 변수
  const [selectedSeatId, setSelectedSeatId] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentReservation, setCurrentReservation] =
    useState<Reservation | null>(null);

  const isAdmin = loggedInUser?.role === "admin";
  const currentStudent = selectedStudent || loggedInStudent;
  const targetGrade = currentStudent?.grade || 3;

  // 학생 목록 로드 (관리자용)
  useEffect(() => {
    if (isAdmin) {
      loadStudents();
    }
  }, [isAdmin]);

  // 현재 학생의 예약 상태 로드 및 selectedSeatId 초기화
  useEffect(() => {
    if (currentStudent) {
      const reservation = reservations.find(
        (r) => r.student_id === currentStudent.id && r.date === currentDate
      );
      setCurrentReservation(reservation || null);

      const initialSeatId =
        reservation?.seat_id || currentStudent.fixed_seat_id || "";

      // 단, 고정좌석이 다른 사람에게 입실 완료 상태로 사용 중이라면 선택하지 않음
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

  const loadStudents = async () => {
    const { data } = await supabase
      .from("students")
      .select("*")
      .order("grade")
      .order("class")
      .order("number");

    if (data) {
      setStudents(data);
    }
  };

  // 예약/변경 가능 여부 확인
  const isSeatAvailableForReservation = (seatId: string) => {
    const reservation = reservations.find(
      (r) => r.seat_id === seatId && r.date === currentDate
    );

    if (!reservation) return true; // 빈 좌석

    // 입실 완료된 좌석은 예약/변경 불가
    if (reservation.status === "입실완료") return false;

    return true;
  };

  // 예약/변경 처리
  const handleReservation = async (action: "reserve" | "cancel") => {
    if (!currentStudent) return;

    try {
      if (action === "reserve") {
        if (!selectedSeatId) {
          alert("좌석을 선택해주세요.");
          return;
        }

        // 최종적으로 선택된 좌석이 다른 사람에게 입실 완료 상태로 사용 중인지 확인
        if (
          !isSeatAvailableForReservation(selectedSeatId) &&
          currentReservation?.seat_id !== selectedSeatId
        ) {
          alert("선택한 좌석은 이미 입실 완료 상태입니다.");
          return;
        }

        // 예약 시간 관련 코드를 모두 제거합니다.
        // const now = new Date();
        // const hours = String(now.getHours()).padStart(2, "0");
        // const minutes = String(now.getMinutes()).padStart(2, "0");
        // const seconds = String(now.getSeconds()).padStart(2, "0");
        // const reservationTime = `${hours}:${minutes}:${seconds}`;

        if (currentReservation) {
          // 기존 예약/입실 기록이 있을 경우: 업데이트 (예약/변경)
          const { error } = await supabase
            .from("reservations")
            .update({
              seat_id: selectedSeatId,
              status: "예약",
              // reservation_time 필드 제거
              check_in_time: null, // 좌석 변경 시 입실 상태 초기화
            })
            .eq("id", currentReservation.id)
            .select("*");

          if (error) throw error;
          alert("좌석 예약이 변경되었습니다.");
        } else {
          // 기존 예약/입실 기록이 없을 경우: 새로 생성
          const { error } = await supabase
            .from("reservations")
            .insert([
              {
                student_id: currentStudent.id,
                seat_id: selectedSeatId,
                date: currentDate,
                status: "예약",
                // reservation_time 필드 제거
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

        // window.confirm 대신 Modal UI를 사용해야 하지만, 현재 상태 유지를 위해 임시로 window.confirm 사용
        if (
          !window.confirm(
            `${currentStudent.name} 학생의 예약을 취소하시겠습니까?`
          )
        )
          return;

        // 예약 취소: 기록을 삭제합니다.
        const { error } = await supabase
          .from("reservations")
          .delete()
          .eq("id", currentReservation.id)
          .select("*");

        if (error) throw error;
        alert("좌석 예약이 취소되었습니다.");
        setSelectedSeatId("");
      }

      await onDataChange(); // 데이터 새로고침
      if (isAdmin && action !== "cancel") {
        // 취소 후에는 학생 목록으로 돌아가지 않음
        // 관리자 모드에서 예약을 성공적으로 마쳤다면, 학생 선택 목록으로 돌아갈 수 있도록 함
        if (action === "reserve") {
          setSelectedStudent(null);
        }
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
          // reservation_time이 없으므로 시간 정보는 표시하지 않음
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

  // --- 조건부 렌더링 ---

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
    // 관리자 모드: 학생 선택 목록
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

  // --- 메인 예약/조회 화면 ---
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
      {/* 관리자 모드 학생 선택 UI */}
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
                setSelectedSeatId(""); // 학생 변경 시 좌석 선택 초기화
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

        {/* 현재 예약 상태 표시 */}
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

        {/* 고정 좌석 경고 메시지 */}
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

        {/* ✅ SeatGrid 컴포넌트 사용 (배치도 형태) */}
        <div style={{ marginBottom: "30px" }}>
          <SeatGrid
            seats={seats}
            reservations={reservations}
            currentDate={currentDate}
            grade={targetGrade} // 현재 로그인된 학생의 학년만 표시
            mode="select"
            onSeatClick={setSelectedSeatId} // 클릭 시 selectedSeatId 업데이트
            selectedSeat={selectedSeatId}
            // StudentView에서만 사용되는 prop: 현재 학생의 ID를 넘겨서 SeatGrid가 본인 예약 여부를 판단하도록 함
            loggedInStudentId={currentStudent.id}
          />
        </div>

        {/* 선택 좌석 및 버튼 영역 */}
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
              // 입실 완료 상태이거나, 좌석이 선택되지 않았으면 버튼 비활성화
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
              // 예약 상태(예약/미입실)일 때만 취소 가능
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
