import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Student, Seat, Reservation } from "../App";

interface StudentViewProps {
  loggedInStudent: Student | null;
  seats: Seat[];
  reservations: Reservation[];
  currentDate: string;
  onDataChange: () => void;
  onShowLogin: () => void;
}

const StudentView: React.FC<StudentViewProps> = ({
  loggedInStudent,
  seats,
  reservations,
  currentDate,
  onDataChange,
  onShowLogin,
}) => {
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  useEffect(() => {
    // 고정 좌석이 있으면 자동 선택
    if (loggedInStudent?.fixed_seat_id) {
      const fixedSeat = seats.find(
        (s) => s.id === loggedInStudent.fixed_seat_id
      );
      if (fixedSeat) {
        setSelectedSeat(fixedSeat);
      }
    }
  }, [loggedInStudent, seats]);

  if (!loggedInStudent) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ fontSize: "14px" }}>로그인이 필요합니다.</p>
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

  const myReservation = reservations.find(
    (r) => r.student_id === loggedInStudent.id && r.date === currentDate
  );

  const availableSeats = seats.filter(
    (s) =>
      s.grade === loggedInStudent.grade &&
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
            student_id: loggedInStudent.id,
            seat_id: selectedSeat.id,
            date: currentDate,
            status: "예약",
            check_in_time: null,
          },
        ])
        .select();

      if (error) throw error;

      alert("예약이 완료되었습니다!");
      setSelectedSeat(null);
      await onDataChange();
    } catch (error) {
      console.error("예약 오류:", error);
      alert("예약에 실패했습니다.");
    }
  };

  const handleCancelReservation = async () => {
    if (!myReservation) return;

    if (!window.confirm("예약을 취소하시겠습니까?")) return;

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

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{ padding: "15px", maxWidth: "1000px", margin: "0 auto" }}>
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
          {loggedInStudent.grade}학년 {loggedInStudent.class}반{" "}
          {loggedInStudent.number}번
        </h2>
        <p
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "#3B82F6",
            margin: 0,
          }}
        >
          {loggedInStudent.name}
        </p>
        {loggedInStudent.fixed_seat_id && (
          <p
            style={{
              color: "#10B981",
              fontSize: "14px",
              marginTop: "5px",
              fontWeight: "bold",
            }}
          >
            📌 고정 좌석: {loggedInStudent.fixed_seat_id}
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

          {loggedInStudent.fixed_seat_id && (
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
            {loggedInStudent.grade === 3 && (
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
                              : seat.id === loggedInStudent.fixed_seat_id
                              ? "3px solid #10B981"
                              : "2px solid #ddd",
                          borderRadius: "8px",
                          background:
                            selectedSeat?.id === seat.id
                              ? "#3B82F6"
                              : seat.id === loggedInStudent.fixed_seat_id
                              ? "#10B981"
                              : "white",
                          color:
                            selectedSeat?.id === seat.id ||
                            seat.id === loggedInStudent.fixed_seat_id
                              ? "white"
                              : "black",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {seat.number}
                        {seat.id === loggedInStudent.fixed_seat_id && "📌"}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {loggedInStudent.grade === 2 && (
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
                                : seat.id === loggedInStudent.fixed_seat_id
                                ? "3px solid #10B981"
                                : "2px solid #ddd",
                            borderRadius: "8px",
                            background:
                              selectedSeat?.id === seat.id
                                ? "#3B82F6"
                                : seat.id === loggedInStudent.fixed_seat_id
                                ? "#10B981"
                                : "white",
                            color:
                              selectedSeat?.id === seat.id ||
                              seat.id === loggedInStudent.fixed_seat_id
                                ? "white"
                                : "black",
                            cursor: "pointer",
                          }}
                        >
                          {seat.number}
                          {seat.id === loggedInStudent.fixed_seat_id && "📌"}
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
                                : seat.id === loggedInStudent.fixed_seat_id
                                ? "3px solid #10B981"
                                : "2px solid #ddd",
                            borderRadius: "8px",
                            background:
                              selectedSeat?.id === seat.id
                                ? "#3B82F6"
                                : seat.id === loggedInStudent.fixed_seat_id
                                ? "#10B981"
                                : "white",
                            color:
                              selectedSeat?.id === seat.id ||
                              seat.id === loggedInStudent.fixed_seat_id
                                ? "white"
                                : "black",
                            cursor: "pointer",
                          }}
                        >
                          {seat.number}
                          {seat.id === loggedInStudent.fixed_seat_id && "📌"}
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
                                : seat.id === loggedInStudent.fixed_seat_id
                                ? "3px solid #10B981"
                                : "2px solid #ddd",
                            borderRadius: "8px",
                            background:
                              selectedSeat?.id === seat.id
                                ? "#3B82F6"
                                : seat.id === loggedInStudent.fixed_seat_id
                                ? "#10B981"
                                : "white",
                            color:
                              selectedSeat?.id === seat.id ||
                              seat.id === loggedInStudent.fixed_seat_id
                                ? "white"
                                : "black",
                            cursor: "pointer",
                          }}
                        >
                          {seat.number}
                          {seat.id === loggedInStudent.fixed_seat_id && "📌"}
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
              {selectedSeat.id === loggedInStudent.fixed_seat_id &&
                " (고정 좌석)"}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default StudentView;
