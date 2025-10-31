import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Student, Seat, Reservation } from "../App";

interface KioskViewProps {
  students: Student[];
  seats: Seat[];
  reservations: Reservation[];
  currentDate: string;
  onDataChange: () => void;
}

const KioskView: React.FC<KioskViewProps> = ({
  students,
  seats,
  reservations,
  currentDate,
  onDataChange,
}) => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectingSeat, setSelectingSeat] = useState(false);
  const [studentForSeatSelection, setStudentForSeatSelection] =
    useState<Student | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  const completeSeatSelection = async (seatId: string) => {
    if (!studentForSeatSelection) return;

    try {
      const now = new Date();
      const checkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("reservations")
        .insert([
          {
            student_id: studentForSeatSelection.id,
            seat_id: seatId,
            date: currentDate,
            status: "입실완료",
            check_in_time: checkInTime,
          },
        ])
        .select();

      if (error) throw error;
      if (data) {
        const seat = seats.find((s) => s.id === seatId);
        alert(
          `${studentForSeatSelection.name} 입실 완료! (좌석: ${seat?.type} ${seat?.number}번)`
        );
        await onDataChange();
        setSelectingSeat(false);
        setStudentForSeatSelection(null);
      }
    } catch (error) {
      console.error("입실 오류:", error);
      alert("입실 처리에 실패했습니다.");
    }
  };

  const checkIn = async (barcode: string) => {
    const student = students.find((s) => s.barcode === barcode);

    if (!student) {
      alert("등록되지 않은 학생증입니다.");
      return;
    }

    const reservation = reservations.find(
      (r) => r.student_id === student.id && r.date === currentDate
    );

    if (reservation) {
      if (reservation.status === "입실완료") {
        alert("이미 입실 처리되었습니다.");
        return;
      }

      try {
        const now = new Date();
        const checkInTime = `${String(now.getHours()).padStart(
          2,
          "0"
        )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
          now.getSeconds()
        ).padStart(2, "0")}`;

        const { data, error } = await supabase
          .from("reservations")
          .update({
            status: "입실완료",
            check_in_time: checkInTime,
          })
          .eq("id", reservation.id)
          .select();

        if (error) throw error;
        if (data) {
          alert(`${student.name} 입실 완료!`);
          await onDataChange();
        }
      } catch (error) {
        console.error("입실 오류:", error);
        alert("입실 처리에 실패했습니다.");
      }
    } else {
      // 고정 좌석 확인
      if (student.fixed_seat_id) {
        const isAvailable = !reservations.find(
          (r) => r.seat_id === student.fixed_seat_id && r.date === currentDate
        );

        if (isAvailable) {
          // 고정 좌석으로 자동 입실
          try {
            const now = new Date();
            const checkInTime = `${String(now.getHours()).padStart(
              2,
              "0"
            )}:${String(now.getMinutes()).padStart(2, "0")}:${String(
              now.getSeconds()
            ).padStart(2, "0")}`;

            const { data, error } = await supabase
              .from("reservations")
              .insert([
                {
                  student_id: student.id,
                  seat_id: student.fixed_seat_id,
                  date: currentDate,
                  status: "입실완료",
                  check_in_time: checkInTime,
                },
              ])
              .select();

            if (error) throw error;
            if (data) {
              const seat = seats.find((s) => s.id === student.fixed_seat_id);
              alert(
                `${student.name} 고정좌석 입실 완료! (${seat?.type} ${seat?.number}번)`
              );
              await onDataChange();
            }
            return;
          } catch (error) {
            console.error("입실 오류:", error);
            alert("입실 처리에 실패했습니다.");
            return;
          }
        }
      }

      // 고정 좌석이 없거나 사용중이면 좌석 선택
      setStudentForSeatSelection(student);
      setSelectingSeat(true);
    }
  };

  const availableSeats = studentForSeatSelection
    ? seats.filter(
        (s) =>
          s.grade === studentForSeatSelection.grade &&
          !reservations.find(
            (r) => r.seat_id === s.id && r.date === currentDate
          )
      )
    : [];

  const isMobile = window.innerWidth < 768;

  if (selectingSeat && studentForSeatSelection) {
    return (
      <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
        <h1
          style={{
            textAlign: "center",
            marginBottom: "15px",
            fontSize: "20px",
          }}
        >
          {studentForSeatSelection.name} - 좌석 선택
        </h1>

        {studentForSeatSelection.fixed_seat_id && (
          <div
            style={{
              background: "#FEF3C7",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px",
              textAlign: "center",
              border: "2px solid #F59E0B",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
              ⚠️ 고정 좌석({studentForSeatSelection.fixed_seat_id})이 사용
              중입니다.
              <br />
              <span style={{ fontSize: "13px", fontWeight: "normal" }}>
                다른 좌석을 선택해주세요.
              </span>
            </p>
          </div>
        )}

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "25px",
            fontSize: "14px",
          }}
        >
          원하는 좌석을 선택해주세요 (남은 좌석: {availableSeats.length}개)
        </p>

        <div style={{ display: "grid", gap: "15px" }}>
          {studentForSeatSelection.grade === 3 && (
            <div
              style={{
                border: "2px solid #ddd",
                borderRadius: "12px",
                padding: "15px",
              }}
            >
              <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
                A그룹 - 3학년
              </h3>
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
                      onClick={() => completeSeatSelection(seat.id)}
                      style={{
                        padding: isMobile ? "15px" : "18px",
                        fontSize: isMobile ? "16px" : "18px",
                        fontWeight: "bold",
                        border: "2px solid #3B82F6",
                        borderRadius: "8px",
                        background: "white",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {seat.number}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {studentForSeatSelection.grade === 2 && (
            <>
              <div
                style={{
                  border: "2px solid #ddd",
                  borderRadius: "12px",
                  padding: "15px",
                }}
              >
                <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
                  B그룹 - 2학년 폐쇄형
                </h3>
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
                        onClick={() => completeSeatSelection(seat.id)}
                        style={{
                          padding: isMobile ? "12px" : "15px",
                          fontSize: isMobile ? "14px" : "16px",
                          fontWeight: "bold",
                          border: "2px solid #3B82F6",
                          borderRadius: "8px",
                          background: "white",
                          cursor: "pointer",
                        }}
                      >
                        {seat.number}
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
                <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
                  C그룹 - 2학년 폐쇄형
                </h3>
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
                        onClick={() => completeSeatSelection(seat.id)}
                        style={{
                          padding: isMobile ? "12px" : "15px",
                          fontSize: isMobile ? "14px" : "16px",
                          fontWeight: "bold",
                          border: "2px solid #3B82F6",
                          borderRadius: "8px",
                          background: "white",
                          cursor: "pointer",
                        }}
                      >
                        {seat.number}
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
                <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
                  D그룹 - 2학년 오픈형
                </h3>
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
                        onClick={() => completeSeatSelection(seat.id)}
                        style={{
                          padding: isMobile ? "12px" : "15px",
                          fontSize: isMobile ? "14px" : "16px",
                          fontWeight: "bold",
                          border: "2px solid #3B82F6",
                          borderRadius: "8px",
                          background: "white",
                          cursor: "pointer",
                        }}
                      >
                        {seat.number}
                      </button>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => {
            setSelectingSeat(false);
            setStudentForSeatSelection(null);
          }}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "14px",
            fontSize: "15px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            background: "white",
            cursor: "pointer",
          }}
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1
        style={{
          textAlign: "center",
          marginBottom: "30px",
          fontSize: "22px",
        }}
      >
        자율학습실 입실
      </h1>

      <div
        style={{
          background: "#EFF6FF",
          padding: "30px 20px",
          borderRadius: "12px",
          marginBottom: "25px",
        }}
      >
        <p
          style={{
            textAlign: "center",
            fontSize: "16px",
            marginBottom: "15px",
          }}
        >
          학생증을 스캔해주세요
        </p>
        <input
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !isComposing) {
              checkIn(barcodeInput);
              setBarcodeInput("");
            }
          }}
          placeholder="바코드 번호 (예: BC2101)"
          style={{
            width: "100%",
            padding: "18px",
            fontSize: "18px",
            textAlign: "center",
            border: "2px solid #3B82F6",
            borderRadius: "8px",
            boxSizing: "border-box",
          }}
          autoFocus
        />
        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#666",
            marginTop: "10px",
          }}
        >
          테스트: BC2101, BC3101 등
        </p>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "15px",
        }}
      >
        <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>
          최근 입실 기록
        </h3>
        {reservations
          .filter((r) => r.status === "입실완료" && r.date === currentDate)
          .slice(-5)
          .reverse()
          .map((r) => {
            const student = students.find((s) => s.id === r.student_id);
            const seat = seats.find((s) => s.id === r.seat_id);
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid #eee",
                  fontSize: "14px",
                }}
              >
                <span style={{ fontWeight: "bold" }}>
                  {student?.name}
                  {student?.fixed_seat_id === seat?.id && (
                    <span style={{ color: "#10B981", marginLeft: "5px" }}>
                      📌
                    </span>
                  )}
                </span>
                <span style={{ fontSize: "13px", color: "#666" }}>
                  {seat?.type} {seat?.number}번 | {r.check_in_time}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default KioskView;
