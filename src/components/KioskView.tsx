import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Student, Seat, Reservation } from "../App";
import SeatGrid from "./SeatGrid";

interface KioskViewProps {
  students: Student[];
  seats: Seat[];
  reservations: Reservation[];
  currentDate: string;
  onDataChange: () => void;
}

interface CheckInOverlay {
  studentName: string;
  grade: number;
  seatInfo?: string;
  status: "success" | "error";
  message: string;
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
  const [selectedSeatId, setSelectedSeatId] = useState<string>("");
  const [isComposing, setIsComposing] = useState(false);
  const [overlay, setOverlay] = useState<CheckInOverlay | null>(null);

  const showOverlay = (data: CheckInOverlay) => {
    setOverlay(data);
    setTimeout(() => {
      setOverlay(null);
    }, 3000);
  };

  const completeSeatSelection = async (seatId: string) => {
    if (!studentForSeatSelection) return;

    try {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const checkInTime = `${hours}:${minutes}:${seconds}`;

      const existingReservation = reservations.find(
        (r) =>
          r.student_id === studentForSeatSelection.id && r.date === currentDate
      );

      let data, error;

      if (existingReservation) {
        ({ data, error } = await supabase
          .from("reservations")
          .update({
            seat_id: seatId,
            status: "입실완료",
            check_in_time: checkInTime,
          })
          .eq("id", existingReservation.id)
          .select());
      } else {
        ({ data, error } = await supabase
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
          .select());
      }

      if (error) throw error;
      if (data) {
        const seat = seats.find((s) => s.id === seatId);

        showOverlay({
          studentName: studentForSeatSelection.name,
          grade: studentForSeatSelection.grade,
          seatInfo: `${seat?.group}구역 ${seat?.number}번`,
          status: "success",
          message: "입실 완료!",
        });

        setTimeout(() => {
          setSelectingSeat(false);
          setStudentForSeatSelection(null);
          setSelectedSeatId("");
        }, 3000);

        await onDataChange();
      }
    } catch (error) {
      console.error("입실 오류:", error);
      alert("입실 처리에 실패했습니다.");
    }
  };

  const checkIn = async (barcode: string) => {
    barcode = barcode.toUpperCase();
    const student = students.find((s) => s.barcode === barcode);

    if (!student) {
      showOverlay({
        studentName: "오류",
        grade: 0,
        status: "error",
        message: "등록되지 않은 학생증입니다.",
      });
      return;
    }

    if (student.is_withdrawn) {
      showOverlay({
        studentName: student.name,
        grade: student.grade,
        status: "error",
        message: "퇴사 처리된 학생입니다.",
      });
      return;
    }

    // 🎯 1학년 처리 (좌석 미사용)
    if (student.grade === 1) {
      try {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const checkTime = `${hours}:${minutes}:${seconds}`;

        const existingReservation = reservations.find(
          (r) => r.student_id === student.id && r.date === currentDate
        );

        const seatInfo = "좌석 미지정";

        if (existingReservation) {
          if (existingReservation.status === "입실완료") {
            showOverlay({
              studentName: student.name,
              grade: student.grade,
              seatInfo: seatInfo,
              status: "error",
              message: "이미 입실 처리되었습니다.",
            });
            return;
          }

          const { error } = await supabase
            .from("reservations")
            .update({
              seat_id: null,
              status: "입실완료",
              check_in_time: checkTime,
              check_out_time: null,
            })
            .eq("id", existingReservation.id);

          if (error) throw error;

          showOverlay({
            studentName: student.name,
            grade: student.grade,
            seatInfo: seatInfo,
            status: "success",
            message: "입실 완료!",
          });
          await onDataChange();
          return;
        }

        const { error, data } = await supabase
          .from("reservations")
          .insert([
            {
              student_id: student.id,
              seat_id: null,
              date: currentDate,
              status: "입실완료",
              check_in_time: checkTime,
            },
          ])
          .select();

        if (error) throw error;
        if (data) {
          showOverlay({
            studentName: student.name,
            grade: student.grade,
            seatInfo: seatInfo,
            status: "success",
            message: "입실 완료!",
          });

          await onDataChange();
        }
      } catch (error) {
        console.error("1학년 입실 오류:", error);
        showOverlay({
          studentName: student.name,
          grade: student.grade,
          status: "error",
          message: "입실 처리에 실패했습니다.",
        });
      }
      return;
    }

    // 🔑 고정좌석 학생 체크 (2, 3학년)
    if (student.fixed_seat_id) {
      try {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const checkInTime = `${hours}:${minutes}:${seconds}`;

        const existingReservation = reservations.find(
          (r) => r.student_id === student.id && r.date === currentDate
        );

        // 이미 입실했는지 확인
        if (existingReservation?.status === "입실완료") {
          const seat = seats.find((s) => s.id === existingReservation.seat_id);
          showOverlay({
            studentName: student.name,
            grade: student.grade,
            seatInfo: seat
              ? `${seat.group}구역 ${seat.number}번`
              : "좌석 정보 없음",
            status: "error",
            message: "이미 입실 처리되었습니다.",
          });
          return;
        }

        // 고정좌석 정보 가져오기
        const fixedSeat = seats.find((s) => s.id === student.fixed_seat_id);

        let data, error;

        if (existingReservation) {
          // 기존 예약 업데이트
          ({ data, error } = await supabase
            .from("reservations")
            .update({
              seat_id: student.fixed_seat_id,
              status: "입실완료",
              check_in_time: checkInTime,
            })
            .eq("id", existingReservation.id)
            .select());
        } else {
          // 새로 입실 기록 생성
          ({ data, error } = await supabase
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
            .select());
        }

        if (error) throw error;
        if (data) {
          showOverlay({
            studentName: student.name,
            grade: student.grade,
            seatInfo: fixedSeat
              ? `${fixedSeat.group}구역 ${fixedSeat.number}번 (고정)`
              : "고정좌석",
            status: "success",
            message: "입실 완료!",
          });

          await onDataChange();
        }
      } catch (error) {
        console.error("고정좌석 입실 오류:", error);
        showOverlay({
          studentName: student.name,
          grade: student.grade,
          status: "error",
          message: "입실 처리에 실패했습니다.",
        });
      }
      return;
    }

    // 🎯 2, 3학년 일반 학생 (고정좌석 없음)
    const reservation = reservations.find(
      (r) => r.student_id === student.id && r.date === currentDate
    );

    if (reservation) {
      // 이미 입실 완료
      if (reservation.status === "입실완료") {
        const seat = seats.find((s) => s.id === reservation.seat_id);
        showOverlay({
          studentName: student.name,
          grade: student.grade,
          seatInfo: seat
            ? `${seat.group}구역 ${seat.number}번`
            : "좌석 정보 없음",
          status: "error",
          message: "이미 입실 처리되었습니다.",
        });
        return;
      }

      // ✅ 예약이 있으면 바로 입실 처리 (2학년, 3학년 모두)
      try {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const checkInTime = `${hours}:${minutes}:${seconds}`;

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
          const seat = seats.find((s) => s.id === reservation.seat_id);

          showOverlay({
            studentName: student.name,
            grade: student.grade,
            seatInfo: seat
              ? `${seat.group}구역 ${seat.number}번`
              : "좌석 정보 없음",
            status: "success",
            message: "입실 완료!",
          });

          await onDataChange();
        }
      } catch (error) {
        console.error("입실 오류:", error);
        showOverlay({
          studentName: student.name,
          grade: student.grade,
          status: "error",
          message: "입실 처리에 실패했습니다.",
        });
      }
    } else {
      // ✅ 예약이 없는 경우 → 좌석 선택 화면으로 이동
      setStudentForSeatSelection(student);
      setSelectingSeat(true);
    }
  };

  // 3학년 좌석 선택하지 않음 처리 함수
  const handleNoSeatSelection = async () => {
    if (!studentForSeatSelection) return;

    try {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const checkInTime = `${hours}:${minutes}:${seconds}`;

      const existingReservation = reservations.find(
        (r) =>
          r.student_id === studentForSeatSelection.id && r.date === currentDate
      );

      let data, error;

      if (existingReservation) {
        ({ data, error } = await supabase
          .from("reservations")
          .update({
            seat_id: null,
            status: "입실완료",
            check_in_time: checkInTime,
          })
          .eq("id", existingReservation.id)
          .select());
      } else {
        ({ data, error } = await supabase
          .from("reservations")
          .insert([
            {
              student_id: studentForSeatSelection.id,
              seat_id: null,
              date: currentDate,
              status: "입실완료",
              check_in_time: checkInTime,
            },
          ])
          .select());
      }

      if (error) throw error;
      if (data) {
        showOverlay({
          studentName: studentForSeatSelection.name,
          grade: studentForSeatSelection.grade,
          status: "success",
          message: "좌석 없이 입실 완료!",
        });

        setTimeout(() => {
          setSelectingSeat(false);
          setStudentForSeatSelection(null);
          setSelectedSeatId("");
        }, 3000);

        await onDataChange();
      }
    } catch (error) {
      console.error("입실 오류:", error);
      alert("입실 처리에 실패했습니다.");
    }
  };

  // 좌석 선택 화면
  if (selectingSeat && studentForSeatSelection) {
    return (
      <div
        style={{
          padding: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
          minHeight: "100vh",
          background: "#F9FAFB",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "30px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
              paddingBottom: "20px",
              borderBottom: "2px solid #E5E7EB",
            }}
          >
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#1F2937",
                marginBottom: "10px",
              }}
            >
              {studentForSeatSelection.name} 학생
            </h1>
            <p style={{ fontSize: "18px", color: "#6B7280" }}>
              {studentForSeatSelection.grade}학년{" "}
              {studentForSeatSelection.class}반 {studentForSeatSelection.number}
              번
            </p>
            {selectedSeatId && (
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#3B82F6",
                  marginTop: "10px",
                }}
              >
                선택한 좌석: {selectedSeatId}
              </p>
            )}
          </div>

          <p
            style={{
              textAlign: "center",
              color: "#4B5563",
              marginBottom: "30px",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            사용할 좌석을 선택해주세요
          </p>

          {/* 3학년만 좌석 선택하지 않음 버튼 */}
          {studentForSeatSelection.grade === 3 && (
            <button
              onClick={handleNoSeatSelection}
              style={{
                width: "100%",
                padding: "20px",
                marginBottom: "20px",
                background: "#8B5CF6",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = "#7C3AED";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = "#8B5CF6";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              📌 좌석 선택하지 않음 (입실만)
            </button>
          )}

          {/* SeatGrid 컴포넌트 - students prop 추가 */}
          <div style={{ marginBottom: "30px" }}>
            <SeatGrid
              seats={seats}
              reservations={reservations}
              currentDate={currentDate}
              grade={studentForSeatSelection.grade}
              mode="select"
              onSeatClick={setSelectedSeatId}
              selectedSeat={selectedSeatId}
              students={students} // 추가: 고정좌석 체크용
            />
          </div>

          {/* 입실하기 & 취소 버튼 */}
          <div style={{ display: "flex", gap: "15px" }}>
            <button
              onClick={() => {
                setSelectingSeat(false);
                setStudentForSeatSelection(null);
                setSelectedSeatId("");
              }}
              style={{
                flex: 1,
                padding: "18px",
                fontSize: "18px",
                border: "2px solid #E5E7EB",
                borderRadius: "12px",
                background: "white",
                cursor: "pointer",
                fontWeight: "bold",
                color: "#6B7280",
              }}
            >
              취소
            </button>
            <button
              onClick={() =>
                selectedSeatId && completeSeatSelection(selectedSeatId)
              }
              disabled={!selectedSeatId}
              style={{
                flex: 1,
                padding: "18px",
                fontSize: "18px",
                border: "none",
                borderRadius: "12px",
                background: selectedSeatId ? "#3B82F6" : "#D1D5DB",
                color: "white",
                cursor: selectedSeatId ? "pointer" : "not-allowed",
                fontWeight: "bold",
              }}
            >
              입실하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 메인 키오스크 화면
  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1400px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "30px",
          fontSize: "28px",
          fontWeight: "bold",
        }}
      >
        자율학습실 입실
      </h1>

      <div
        style={{
          background: "#EFF6FF",
          padding: "30px 20px",
          borderRadius: "16px",
          marginBottom: "30px",
          border: "2px solid #3B82F6",
        }}
      >
        <p
          style={{
            textAlign: "center",
            fontSize: "20px",
            marginBottom: "20px",
            fontWeight: "bold",
            color: "#1F2937",
          }}
        >
          학생증 번호를 입력해주세요.
        </p>
        <input
          type="text"
          value={barcodeInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setBarcodeInput(e.target.value)
          }
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && !isComposing) {
              checkIn(barcodeInput);
              setBarcodeInput("");
            }
          }}
          placeholder="바코드 번호 (예: BC2101)"
          style={{
            width: "100%",
            padding: "20px",
            fontSize: "22px",
            textAlign: "center",
            border: "3px solid #3B82F6",
            borderRadius: "12px",
            boxSizing: "border-box",
            fontFamily: "monospace",
          }}
          autoFocus
        />
      </div>

      {/* 좌석 배치도 */}
      <div
        style={{
          position: "relative",
          marginBottom: "20px",
          border: "2px solid #ddd",
          borderRadius: "16px",
          padding: "20px",
          background: "white",
        }}
      >
        <h3
          style={{
            textAlign: "center",
            marginBottom: "20px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          좌석 배치도
        </h3>
        <div style={{ position: "relative" }}>
          <img
            src="https://raw.githubusercontent.com/skywind99/imgtemp/refs/heads/main/position.jpg"
            alt="좌석 배치도"
            style={{
              width: "100%",
              maxWidth: "900px",
              margin: "0 auto",
              display: "block",
              borderRadius: "8px",
            }}
          />

          {/* 입실 확인 오버레이 */}
          {overlay && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.85)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  background:
                    overlay.status === "success" ? "#10B981" : "#EF4444",
                  padding: "40px 60px",
                  borderRadius: "20px",
                  textAlign: "center",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ fontSize: "72px", marginBottom: "20px" }}>
                  {overlay.status === "success" ? "✓" : "✗"}
                </div>
                <h2
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: "15px",
                  }}
                >
                  {overlay.studentName}
                </h2>
                <p
                  style={{
                    fontSize: "24px",
                    color: "white",
                    marginBottom: "10px",
                  }}
                >
                  {overlay.grade}학년
                </p>
                {overlay.seatInfo && (
                  <p
                    style={{
                      fontSize: "28px",
                      color: "white",
                      marginBottom: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    {overlay.seatInfo}
                  </p>
                )}
                <p
                  style={{
                    fontSize: "24px",
                    color: "white",
                    margin: 0,
                    fontWeight: "bold",
                  }}
                >
                  {overlay.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 최근 입실 기록 */}
      <div
        style={{
          border: "2px solid #ddd",
          borderRadius: "16px",
          padding: "20px",
          background: "white",
        }}
      >
        <h3
          style={{
            fontSize: "20px",
            marginBottom: "15px",
            fontWeight: "bold",
          }}
        >
          최근 입실 기록
        </h3>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {reservations
            .filter(
              (r: Reservation) =>
                r.status === "입실완료" && r.date === currentDate
            )
            .slice(-10)
            .reverse()
            .map((r: Reservation, index: number) => {
              const student = students.find(
                (s: Student) => s.id === r.student_id
              );
              const seat = seats.find((s: Seat) => s.id === r.seat_id);
              const isFixedSeat = student?.fixed_seat_id === r.seat_id;

              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "15px",
                    borderBottom: index === 9 ? "none" : "1px solid #E5E7EB",
                    fontSize: "16px",
                    background: index % 2 === 0 ? "#F9FAFB" : "white",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: "18px",
                        color: "#1F2937",
                      }}
                    >
                      {student?.name}
                    </span>
                    <span
                      style={{
                        background: "#DBEAFE",
                        color: "#1E40AF",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {student?.grade}학년
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      color: "#6B7280",
                    }}
                  >
                    <span style={{ fontWeight: "bold" }}>
                      {student?.grade === 1 || !seat
                        ? "입실"
                        : `${seat.group}구역 ${seat.number}번${
                            isFixedSeat ? " 🔑" : ""
                          }`}
                    </span>
                    <span style={{ fontSize: "14px" }}>{r.check_in_time}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default KioskView;

