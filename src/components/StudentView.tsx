import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Student, Seat, Reservation, User } from "../App";

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
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const isAdmin = loggedInUser?.role === "admin";
  const currentStudent = selectedStudent || loggedInStudent;

  // ✅ 모든 useEffect를 최상단에 배치
  useEffect(() => {
    if (isAdmin) {
      loadStudents();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (currentStudent?.fixed_seat_id) {
      const fixedSeat = seats.find(
        (s) => s.id === currentStudent.fixed_seat_id
      );
      if (fixedSeat) {
        setSelectedSeat(fixedSeat);
      }
    }
  }, [currentStudent, seats]);

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

  // ✅ 이제 조건부 렌더링 (모든 Hook 이후)
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

  const myReservation = reservations.find(
    (r) => r.student_id === currentStudent.id && r.date === currentDate
  );

  const availableSeats = seats.filter(
    (s) =>
      s.grade === currentStudent.grade &&
      !reservations.find((r) => r.seat_id === s.id && r.date === currentDate)
  );

  const handleReservation = async () => {
    if (!selectedSeat) {
      alert("좌석을 선택해주세요.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("reservations")
        .insert([
          {
            student_id: currentStudent.id,
            seat_id: selectedSeat.id,
            date: currentDate,
            status: "예약",
            check_in_time: null,
          },
        ])
        .select();

      if (error) throw error;

      alert(`${currentStudent.name} 학생의 예약이 완료되었습니다!`);
      setSelectedSeat(null);
      if (isAdmin) {
        setSelectedStudent(null);
      }
      await onDataChange();
    } catch (error) {
      console.error("예약 오류:", error);
      alert("예약에 실패했습니다.");
    }
  };

  const handleCancelReservation = async () => {
    if (!myReservation) return;

    if (
      !window.confirm(`${currentStudent.name} 학생의 예약을 취소하시겠습니까?`)
    )
      return;

    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", myReservation.id);

      if (error) throw error;

      alert("예약이 취소되었습니다.");
      if (isAdmin) {
        setSelectedStudent(null);
      }
      await onDataChange();
    } catch (error) {
      console.error("예약 취소 오류:", error);
      alert("예약 취소에 실패했습니다.");
    }
  };

  const isMobile = window.innerWidth < 768;

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
                setSelectedSeat(null);
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
              다른 학생 선택
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          background: "#EFF6FF",
          padding: "15px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "8px",
          }}
        >
          {currentStudent.grade}학년 {currentStudent.class}반{" "}
          {currentStudent.number}번
        </h2>
        <p
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "#3B82F6",
            margin: 0,
          }}
        >
          {currentStudent.name}
        </p>
        {currentStudent.fixed_seat_id && (
          <p
            style={{
              color: "#10B981",
              fontSize: "14px",
              marginTop: "5px",
              fontWeight: "bold",
            }}
          >
            📌 고정 좌석: {currentStudent.fixed_seat_id}
          </p>
        )}
        <p style={{ color: "#666", fontSize: "13px", marginTop: "5px" }}>
          자율학습 좌석 예약
        </p>
      </div>

      {myReservation ? (
        <div
          style={{
            background:
              myReservation.status === "입실완료" ? "#D1FAE5" : "#FEF3C7",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "15px",
            }}
          >
            ✓ 예약 완료
          </h3>
          <div style={{ fontSize: "15px", lineHeight: "1.8" }}>
            <p>
              <strong>좌석:</strong>{" "}
              {seats.find((s) => s.id === myReservation.seat_id)?.type}{" "}
              {seats.find((s) => s.id === myReservation.seat_id)?.number}번
            </p>
            <p>
              <strong>상태:</strong>{" "}
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "4px",
                  background:
                    myReservation.status === "입실완료" ? "#10B981" : "#F59E0B",
                  color: "white",
                  fontSize: "14px",
                }}
              >
                {myReservation.status}
              </span>
            </p>
            {myReservation.check_in_time && (
              <p>
                <strong>입실시간:</strong> {myReservation.check_in_time}
              </p>
            )}
          </div>

          {myReservation.status !== "입실완료" && (
            <button
              onClick={handleCancelReservation}
              style={{
                marginTop: "15px",
                padding: "12px 24px",
                background: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "bold",
                width: isMobile ? "100%" : "auto",
              }}
            >
              예약 취소
            </button>
          )}
        </div>
      ) : (
        <>
          <h3
            style={{
              fontSize: "17px",
              fontWeight: "bold",
              marginBottom: "15px",
            }}
          >
            사용 가능한 좌석 ({availableSeats.length}석)
          </h3>

          {currentStudent.fixed_seat_id && (
            <div
              style={{
                background: "#F0FDF4",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "15px",
                border: "2px solid #10B981",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  margin: 0,
                  color: "#065F46",
                  fontWeight: "bold",
                }}
              >
                📌 고정 좌석이 자동으로 선택되었습니다.
                <br />
                <span style={{ fontSize: "12px", fontWeight: "normal" }}>
                  다른 좌석을 원하시면 아래에서 선택해주세요.
                </span>
              </p>
            </div>
          )}

          <div style={{ display: "grid", gap: "15px" }}>
            {currentStudent.grade === 3 && (
              <div
                style={{
                  border: "2px solid #ddd",
                  borderRadius: "12px",
                  padding: "15px",
                }}
              >
                <h4
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "12px",
                  }}
                >
                  A그룹 - 3학년석
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "repeat(5, 1fr)"
                      : "repeat(7, 1fr)",
                    gap: "8px",
                  }}
                >
                  {availableSeats
                    .filter((s) => s.group === "A")
                    .map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => setSelectedSeat(seat)}
                        style={{
                          padding: isMobile ? "15px 10px" : "18px",
                          fontSize: isMobile ? "14px" : "16px",
                          fontWeight: "bold",
                          border:
                            selectedSeat?.id === seat.id
                              ? "3px solid #3B82F6"
                              : seat.id === currentStudent.fixed_seat_id
                              ? "3px solid #10B981"
                              : "2px solid #ddd",
                          borderRadius: "8px",
                          background:
                            selectedSeat?.id === seat.id
                              ? "#3B82F6"
                              : seat.id === currentStudent.fixed_seat_id
                              ? "#10B981"
                              : "white",
                          color:
                            selectedSeat?.id === seat.id ||
                            seat.id === currentStudent.fixed_seat_id
                              ? "white"
                              : "black",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {seat.number}
                        {seat.id === currentStudent.fixed_seat_id && "📌"}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {currentStudent.grade === 2 && (
              <>
                <div
                  style={{
                    border: "2px solid #ddd",
                    borderRadius: "12px",
                    padding: "15px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      marginBottom: "12px",
                    }}
                  >
                    B그룹 - 2학년 폐쇄형
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "repeat(5, 1fr)"
                        : "repeat(7, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {availableSeats
                      .filter((s) => s.group === "B")
                      .map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => setSelectedSeat(seat)}
                          style={{
                            padding: isMobile ? "12px 8px" : "15px",
                            fontSize: isMobile ? "13px" : "14px",
                            fontWeight: "bold",
                            border:
                              selectedSeat?.id === seat.id
                                ? "3px solid #3B82F6"
                                : seat.id === currentStudent.fixed_seat_id
                                ? "3px solid #10B981"
                                : "2px solid #ddd",
                            borderRadius: "8px",
                            background:
                              selectedSeat?.id === seat.id
                                ? "#3B82F6"
                                : seat.id === currentStudent.fixed_seat_id
                                ? "#10B981"
                                : "white",
                            color:
                              selectedSeat?.id === seat.id ||
                              seat.id === currentStudent.fixed_seat_id
                                ? "white"
                                : "black",
                            cursor: "pointer",
                          }}
                        >
                          {seat.number}
                          {seat.id === currentStudent.fixed_seat_id && "📌"}
                        </button>
                      ))}
                  </div>
                </div>

                <div
                  style={{
                    border: "2px solid #ddd",
                    borderRadius: "12px",
                    padding: "15px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      marginBottom: "12px",
                    }}
                  >
                    C그룹 - 2학년 폐쇄형
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "repeat(5, 1fr)"
                        : "repeat(7, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {availableSeats
                      .filter((s) => s.group === "C")
                      .map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => setSelectedSeat(seat)}
                          style={{
                            padding: isMobile ? "12px 8px" : "15px",
                            fontSize: isMobile ? "13px" : "14px",
                            fontWeight: "bold",
                            border:
                              selectedSeat?.id === seat.id
                                ? "3px solid #3B82F6"
                                : seat.id === currentStudent.fixed_seat_id
                                ? "3px solid #10B981"
                                : "2px solid #ddd",
                            borderRadius: "8px",
                            background:
                              selectedSeat?.id === seat.id
                                ? "#3B82F6"
                                : seat.id === currentStudent.fixed_seat_id
                                ? "#10B981"
                                : "white",
                            color:
                              selectedSeat?.id === seat.id ||
                              seat.id === currentStudent.fixed_seat_id
                                ? "white"
                                : "black",
                            cursor: "pointer",
                          }}
                        >
                          {seat.number}
                          {seat.id === currentStudent.fixed_seat_id && "📌"}
                        </button>
                      ))}
                  </div>
                </div>

                <div
                  style={{
                    border: "2px solid #ddd",
                    borderRadius: "12px",
                    padding: "15px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      marginBottom: "12px",
                    }}
                  >
                    D그룹 - 2학년 오픈형
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "repeat(6, 1fr)"
                        : "repeat(8, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {availableSeats
                      .filter((s) => s.group === "D")
                      .map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => setSelectedSeat(seat)}
                          style={{
                            padding: isMobile ? "12px 8px" : "15px",
                            fontSize: isMobile ? "13px" : "14px",
                            fontWeight: "bold",
                            border:
                              selectedSeat?.id === seat.id
                                ? "3px solid #3B82F6"
                                : seat.id === currentStudent.fixed_seat_id
                                ? "3px solid #10B981"
                                : "2px solid #ddd",
                            borderRadius: "8px",
                            background:
                              selectedSeat?.id === seat.id
                                ? "#3B82F6"
                                : seat.id === currentStudent.fixed_seat_id
                                ? "#10B981"
                                : "white",
                            color:
                              selectedSeat?.id === seat.id ||
                              seat.id === currentStudent.fixed_seat_id
                                ? "white"
                                : "black",
                            cursor: "pointer",
                          }}
                        >
                          {seat.number}
                          {seat.id === currentStudent.fixed_seat_id && "📌"}
                        </button>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {selectedSeat && (
            <button
              onClick={handleReservation}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "18px",
                background: "#3B82F6",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "17px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {selectedSeat.type} {selectedSeat.number}번 예약하기
              {selectedSeat.id === currentStudent.fixed_seat_id &&
                " (고정 좌석)"}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default StudentView;
