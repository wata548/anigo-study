import React from "react";
import { Seat, Reservation, Student } from "../App";
interface SeatGridProps {
  seats: Seat[];
  reservations: Reservation[];
  currentDate: string;
  grade: number;
  onSeatClick?: (seatId: string) => void;
  selectedSeat?: string;
  mode: "view" | "select";
  loggedInStudentId?: string;
  students?: Student[]; // 추가
}

const SeatGrid: React.FC<SeatGridProps> = ({
  seats,
  reservations,
  currentDate,
  grade,
  onSeatClick,
  selectedSeat,
  mode,
  loggedInStudentId,
  students = [], // 기본값 추가
}) => {
  const isMobile = window.innerWidth < 768;

  // 좌석 클릭 가능 여부 확인
  const isSeatClickable = (seatId: string) => {
    if (mode === "view") return false;

    // 🔒 로그인한 학생이 고정좌석을 가지고 있는지 확인
    if (loggedInStudentId) {
      const loggedInStudent = students.find(
        (st) => st.id === loggedInStudentId
      );

      // 고정좌석 학생은 자신의 고정좌석이 아닌 다른 좌석 클릭 불가
      if (loggedInStudent?.fixed_seat_id) {
        // 본인의 고정좌석도 클릭 불가 (예약 화면에서는 선택 자체가 안 되어야 함)
        return false;
      }
    }

    // 🔒 다른 학생의 고정좌석 체크
    const fixedSeatStudent = students.find((st) => st.fixed_seat_id === seatId);
    if (fixedSeatStudent && fixedSeatStudent.id !== loggedInStudentId) {
      return false; // 다른 학생의 고정좌석은 클릭 불가
    }

    const reservation = reservations.find(
      (r) => r.seat_id === seatId && r.date === currentDate
    );

    if (!reservation) {
      // 빈 좌석은 클릭 가능
      return true;
    }

    // 예약 기록이 있는 경우:
    // 1. 입실 완료 상태는 클릭 불가능
    if (reservation.status === "입실완료") {
      return false;
    }

    // 2. 예약, 미입실 상태는 본인 예약만 클릭 가능
    if (reservation.status === "예약" || reservation.status === "미입실") {
      return reservation.student_id === loggedInStudentId;
    }

    return true;
  };

  const getSeatStatus = (seatId: string) => {
    const reservation = reservations.find(
      (r) => r.seat_id === seatId && r.date === currentDate
    );
    return reservation?.status || "empty";
  };

  // 좌석 색상 (선택 모드일 때 본인 예약 색상 처리 포함)
  const getSeatColor = (seatId: string) => {
    if (mode === "select") {
      // 🔒 로그인한 학생이 고정좌석을 가지고 있으면 모든 좌석을 회색으로
      if (loggedInStudentId) {
        const loggedInStudent = students.find(
          (st) => st.id === loggedInStudentId
        );
        if (loggedInStudent?.fixed_seat_id) {
          // 본인의 고정좌석은 연두색으로 표시 (하지만 클릭 불가)
          if (seatId === loggedInStudent.fixed_seat_id) {
            return "#BBF7D0";
          }
          // 나머지는 모두 회색 (선택 불가 표시)
          return "#E5E7EB";
        }
      }

      if (selectedSeat === seatId) return "#3B82F6"; // 선택된 좌석은 파랑

      // 🔒 다른 학생의 고정좌석은 회색으로 표시
      const fixedSeatStudent = students.find(
        (st) => st.fixed_seat_id === seatId
      );
      if (fixedSeatStudent && fixedSeatStudent.id !== loggedInStudentId) {
        return "#E5E7EB";
      }

      const reservation = reservations.find(
        (r) => r.seat_id === seatId && r.date === currentDate
      );

      const status = reservation?.status || "empty";
      const isMyReservation = reservation?.student_id === loggedInStudentId;

      if (status === "empty") return "white"; // 빈 좌석은 흰색

      if (status === "예약" || status === "미입실") {
        return isMyReservation ? "#CFFDF2" : "#FEF3C7";
      }

      if (status === "입실완료") return "#E5E7EB"; // 입실 완료 좌석은 회색

      return "white";
    }

    // mode === "view" (대시보드 등)
    const status = getSeatStatus(seatId);
    switch (status) {
      case "입실완료":
        return "#10B981";
      case "예약":
        return "#F59E0B";
      case "미입실":
        return "#EF4444";
      default:
        return "white";
    }
  };
  // ... 나머지 코드는 동일
  const getSeatNumber = (seatId: string) => {
    const seat = seats.find((s) => s.id === seatId);
    return seat?.number.toString() || seatId.split("-")[1] || "";
  };

  const getSeatStyle = (seatId: string, isClickable: boolean) => {
    const baseStyle: React.CSSProperties = {
      width: "100%",
      aspectRatio: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: selectedSeat === seatId ? "3px solid #3B82F6" : "2px solid #ddd",
      borderRadius: "8px",
      background: getSeatColor(seatId),
      color: mode === "select" && selectedSeat === seatId ? "white" : "#1F2937",
      fontSize: isMobile ? "14px" : "16px",
      fontWeight: "bold",
      cursor: isClickable ? "pointer" : "not-allowed",
      transition: "all 0.2s",
      opacity: isClickable ? 1 : 0.6, // 선택 불가능한 좌석은 투명도를 낮춥니다.
    };
    return baseStyle;
  };

  const emptyStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "1",
    visibility: "hidden",
  };

  // A구역: 3학년석 (왼쪽 1열 7개 + 오른쪽 3×2 테이블 4개)
  const renderGroupA = () => {
    if (grade !== 3) return null;

    const groupASeats = seats
      .filter((s) => s.group === "A" && s.grade === 3)
      .sort((a, b) => a.number - b.number);

    // D구역처럼 renderSeats 유틸리티 함수를 정의합니다.
    const renderSeats = (seatList: Seat[], columns: number) => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "8px",
        }}
      >
        {seatList.map((seat) => {
          const isClickable = isSeatClickable(seat.id);
          return (
            <button
              key={seat.id}
              onClick={() => isClickable && onSeatClick?.(seat.id)}
              style={getSeatStyle(seat.id, isClickable)}
              disabled={!isClickable}
            >
              {getSeatNumber(seat.id)}
            </button>
          );
        })}
      </div>
    );

    return (
      <div style={{ marginBottom: "30px" }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "15px",
            color: "#3B82F6",
          }}
        >
          A구역 - 3학년석 (31석)
        </h3>

        <div style={{ display: "flex", gap: "20px" }}>
          {/* 왼쪽 1열 (1-7번) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gridTemplateRows: "repeat(7, 1fr)",
              gap: "8px",
              width: "60px",
            }}
          >
            {groupASeats.slice(0, 7).map((seat) => {
              const isClickable = isSeatClickable(seat.id);
              return (
                <button
                  key={seat.id}
                  onClick={() => isClickable && onSeatClick?.(seat.id)}
                  style={getSeatStyle(seat.id, isClickable)}
                  disabled={!isClickable}
                >
                  {getSeatNumber(seat.id)}
                </button>
              );
            })}
          </div>

          {/* 오른쪽 3×2 테이블 4개 (8-31번) */}
          <div style={{ flex: 1 }}>
            {/* 상단 2개 테이블 (8-19번) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr) 30px repeat(3, 1fr)",
                gap: "8px",
                marginBottom: "15px",
                maxWidth: "450px",
              }}
            >
              {/* 좌측 테이블 (8-13번) */}
              {groupASeats.slice(7, 13).map((seat) => {
                const isClickable = isSeatClickable(seat.id);
                return (
                  <button
                    key={seat.id}
                    onClick={() => isClickable && onSeatClick?.(seat.id)}
                    style={getSeatStyle(seat.id, isClickable)}
                    disabled={!isClickable}
                  >
                    {getSeatNumber(seat.id)}
                  </button>
                );
              })}

              {/* 중간 공간 */}
              <div style={{ gridColumn: "4", gridRow: "1 / 3" }}></div>

              {/* 우측 테이블 (14-19번) */}
              {groupASeats.slice(13, 19).map((seat) => {
                const isClickable = isSeatClickable(seat.id);
                return (
                  <button
                    key={seat.id}
                    onClick={() => isClickable && onSeatClick?.(seat.id)}
                    style={getSeatStyle(seat.id, isClickable)}
                    disabled={!isClickable}
                  >
                    {getSeatNumber(seat.id)}
                  </button>
                );
              })}
            </div>

            {/* 하단 2개 테이블 (20-31번) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr) 30px repeat(3, 1fr)",
                gap: "8px",
                maxWidth: "450px",
              }}
            >
              {/* 좌측 테이블 (20-25번) */}
              {groupASeats.slice(19, 25).map((seat) => {
                const isClickable = isSeatClickable(seat.id);
                return (
                  <button
                    key={seat.id}
                    onClick={() => isClickable && onSeatClick?.(seat.id)}
                    style={getSeatStyle(seat.id, isClickable)}
                    disabled={!isClickable}
                  >
                    {getSeatNumber(seat.id)}
                  </button>
                );
              })}

              {/* 중간 공간 */}
              <div style={{ gridColumn: "4", gridRow: "1 / 3" }}></div>

              {/* 우측 테이블 (26-31번) */}
              {groupASeats.slice(25, 31).map((seat) => {
                const isClickable = isSeatClickable(seat.id);
                return (
                  <button
                    key={seat.id}
                    onClick={() => isClickable && onSeatClick?.(seat.id)}
                    style={getSeatStyle(seat.id, isClickable)}
                    disabled={!isClickable}
                  >
                    {getSeatNumber(seat.id)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // B구역: 2학년 폐쇄형 (10열 × 4행, 마지막 줄 39번까지)
  const renderGroupB = () => {
    if (grade !== 2) return null;

    const groupBSeats = seats
      .filter((s) => s.group === "B" && s.grade === 2)
      .sort((a, b) => a.number - b.number);

    // 10열 × 4행으로 재배치 (열 우선 순서)
    // 1열: 1,2,3,4 / 2열: 5,6,7,8 / ... / 10열: 37,38,39,(빈칸)
    const reorderedSeats: (Seat | null)[] = [];
    const cols = 10;
    const rows = 4;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const seatIndex = col * rows + row; // 열 우선 인덱스
        if (seatIndex < groupBSeats.length) {
          reorderedSeats.push(groupBSeats[seatIndex]);
        } else {
          reorderedSeats.push(null); // 빈 칸
        }
      }
    }

    return (
      <div style={{ marginBottom: "30px" }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "15px",
            color: "#10B981",
          }}
        >
          B구역 - 2학년 폐쇄형 (39석){" "}
          {groupBSeats.length > 0 ? `- 현재 ${groupBSeats.length}석` : ""}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gap: "8px",
            maxWidth: "800px",
          }}
        >
          {reorderedSeats.map((seat, index) => {
            if (!seat) {
              return <div key={`empty-${index}`} style={emptyStyle}></div>;
            }

            const isClickable = isSeatClickable(seat.id);
            return (
              <button
                key={seat.id}
                onClick={() => isClickable && onSeatClick?.(seat.id)}
                style={getSeatStyle(seat.id, isClickable)}
                disabled={!isClickable}
              >
                {getSeatNumber(seat.id)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // C구역: 2학년 폐쇄형 (7열 × 4행, 마지막 줄 양쪽 끝 공석)
  const renderGroupC = () => {
    if (grade !== 2) return null;

    const groupCSeats = seats
      .filter((s) => s.group === "C" && s.grade === 2)
      .sort((a, b) => a.number - b.number);

    // 7열 × 4행으로 재배치 (열 우선 순서)
    // 마지막 줄 양쪽 끝은 공석: 1열 4행과 7열 4행이 빈칸
    const reorderedSeats: (Seat | null)[] = [];
    const cols = 7;
    const rows = 4;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 마지막 줄(row=3)의 첫 번째(col=0)와 마지막(col=6) 칸은 비움
        if (row === 3 && (col === 0 || col === 6)) {
          reorderedSeats.push(null);
          continue;
        }

        // 실제 좌석 인덱스 계산
        let seatIndex;
        if (row === 3) {
          // 마지막 줄: col 1~6만 좌석이 있음 (22-26번, 5석)
          seatIndex = col * rows + row - col; // col에 따라 조정
          if (col > 0 && col < 6) {
            seatIndex = 21 + (col - 1); // 22-26번
          } else {
            seatIndex = -1; // 빈칸
          }
        } else {
          // 1-3줄: 정상적으로 열 우선 계산
          if (col === 0) {
            seatIndex = row; // 1,8,15
          } else if (col === 6) {
            seatIndex = col * 3 + row; // 7,14,21
          } else {
            // col 1-5
            seatIndex = col * 3 + row + (col - 1); // 조정된 인덱스
          }
        }

        if (seatIndex >= 0 && seatIndex < groupCSeats.length) {
          reorderedSeats.push(groupCSeats[seatIndex]);
        } else {
          reorderedSeats.push(null);
        }
      }
    }

    // 더 간단한 방법으로 다시 구현
    const grid: (Seat | null)[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(null));

    let seatIdx = 0;
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        // 마지막 줄 양쪽 끝은 비움
        if (row === 3 && (col === 0 || col === 6)) {
          grid[row][col] = null;
        } else {
          if (seatIdx < groupCSeats.length) {
            grid[row][col] = groupCSeats[seatIdx];
            seatIdx++;
          }
        }
      }
    }

    // grid를 1차원 배열로 변환 (행 우선)
    const flatSeats: (Seat | null)[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        flatSeats.push(grid[row][col]);
      }
    }

    return (
      <div style={{ marginBottom: "30px" }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "15px",
            color: "#8B5CF6",
          }}
        >
          C구역 - 2학년 폐쇄형 (26석)
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "8px",
            maxWidth: "600px",
          }}
        >
          {flatSeats.map((seat, index) => {
            if (!seat) {
              return <div key={`empty-${index}`} style={emptyStyle}></div>;
            }

            const isClickable = isSeatClickable(seat.id);
            return (
              <button
                key={seat.id}
                onClick={() => isClickable && onSeatClick?.(seat.id)}
                style={getSeatStyle(seat.id, isClickable)}
                disabled={!isClickable}
              >
                {getSeatNumber(seat.id)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // D구역: 2학년 오픈형 (2x2 테이블 3개, 1x8줄, 3x2 테이블 2개)
  const renderGroupD = () => {
    if (grade !== 2) return null;

    const groupDSeats = seats
      .filter((s) => s.group === "D" && s.grade === 2)
      .sort((a, b) => a.number - b.number);

    // D-1 ~ D-12: 2x2 테이블 3개 (12석)
    const table2x2_seats = groupDSeats.slice(0, 12);
    // D-13 ~ D-20: 1x8 줄 (8석)
    const row1x8_seats = groupDSeats.slice(12, 20);
    // D-21 ~ D-26: 상단 오른쪽 3x2 테이블 (6석)
    const upperTableSeats = groupDSeats.slice(20, 26);
    // D-27 ~ D-32: 하단 오른쪽 3x2 테이블 (6석)
    const lowerTableSeats = groupDSeats.slice(26, 32);

    // 2x2 테이블 3개 각각
    const table2x2_1 = table2x2_seats.slice(0, 4);
    const table2x2_2 = table2x2_seats.slice(4, 8);
    const table2x2_3 = table2x2_seats.slice(8, 12);

    return (
      <div style={{ marginBottom: "30px" }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "15px",
            color: "#F59E0B",
          }}
        >
          D구역 - 2학년 오픈형 (32석)
        </h3>

        <div
          style={{
            display: "flex",
            gap: isMobile ? "20px" : "50px", // A와 B 사이 간격
            alignItems: "flex-start",
            flexWrap: "wrap", // 공간 부족시 B가 아래로
          }}
        >
          {/* ========== A 그룹 (왼쪽) ========== */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? "15px" : "20px",
              padding: isMobile ? "15px" : "20px",
              flex: "0 1 auto", // 고정 크기, 축소 가능
              minWidth: isMobile ? "300px" : "450px", // 최소 너비 유지
              // background: "#FEF3C7",
              // borderRadius: "12px",
              // border: "2px solid #FCD34D",
            }}
          >
            {/* 상단: 2x2 테이블 3개 */}
            <div
              style={{
                display: "flex",
                gap: isMobile ? "10px" : "20px", // 테이블 간 간격
                justifyContent: "space-between",
              }}
            >
              {/* 첫 번째 2x2 테이블 (1,2,3,4) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                  flex: "1 1 0",
                  maxWidth: "110px",
                }}
              >
                {table2x2_1.map((seat) => {
                  const isClickable = isSeatClickable(seat.id);
                  return (
                    <button
                      key={seat.id}
                      onClick={() => isClickable && onSeatClick?.(seat.id)}
                      style={getSeatStyle(seat.id, isClickable)}
                      disabled={!isClickable}
                    >
                      {getSeatNumber(seat.id)}
                    </button>
                  );
                })}
              </div>

              {/* 두 번째 2x2 테이블 (5,6,7,8) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                  flex: "1 1 0",
                  maxWidth: "110px",
                }}
              >
                {table2x2_2.map((seat) => {
                  const isClickable = isSeatClickable(seat.id);
                  return (
                    <button
                      key={seat.id}
                      onClick={() => isClickable && onSeatClick?.(seat.id)}
                      style={getSeatStyle(seat.id, isClickable)}
                      disabled={!isClickable}
                    >
                      {getSeatNumber(seat.id)}
                    </button>
                  );
                })}
              </div>

              {/* 세 번째 2x2 테이블 (9,10,11,12) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                  flex: "1 1 0",
                  maxWidth: "110px",
                }}
              >
                {table2x2_3.map((seat) => {
                  const isClickable = isSeatClickable(seat.id);
                  return (
                    <button
                      key={seat.id}
                      onClick={() => isClickable && onSeatClick?.(seat.id)}
                      style={getSeatStyle(seat.id, isClickable)}
                      disabled={!isClickable}
                    >
                      {getSeatNumber(seat.id)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 하단: 1x8 줄 (13-20) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: "8px",
                paddingTop: "10px",
                width: "100%",
              }}
            >
              {row1x8_seats.map((seat) => {
                const isClickable = isSeatClickable(seat.id);
                return (
                  <button
                    key={seat.id}
                    onClick={() => isClickable && onSeatClick?.(seat.id)}
                    style={getSeatStyle(seat.id, isClickable)}
                    disabled={!isClickable}
                  >
                    {getSeatNumber(seat.id)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========== B 그룹 (오른쪽, 공간 부족시 아래로) ========== */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? "15px" : "20px",
              padding: isMobile ? "15px" : "20px",
              flex: "0 0 auto", // 고정 크기
              width: "220px", // 고정 너비
              // background: "#DBEAFE",
              // borderRadius: "12px",
              // border: "2px solid #93C5FD",
            }}
          >
            {/* 상단: 3x2 테이블 (21-26) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px",
                width: "100%",
                maxWidth: "180px",
              }}
            >
              {upperTableSeats.map((seat) => {
                const isClickable = isSeatClickable(seat.id);
                return (
                  <button
                    key={seat.id}
                    onClick={() => isClickable && onSeatClick?.(seat.id)}
                    style={getSeatStyle(seat.id, isClickable)}
                    disabled={!isClickable}
                  >
                    {getSeatNumber(seat.id)}
                  </button>
                );
              })}
            </div>

            {/* 하단: 3x2 테이블 (27-32) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px",
                width: "100%",
                maxWidth: "180px",
              }}
            >
              {lowerTableSeats.map((seat) => {
                const isClickable = isSeatClickable(seat.id);
                return (
                  <button
                    key={seat.id}
                    onClick={() => isClickable && onSeatClick?.(seat.id)}
                    style={getSeatStyle(seat.id, isClickable)}
                    disabled={!isClickable}
                  >
                    {getSeatNumber(seat.id)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div>
      {/* grade prop에 따라 해당 학년 좌석 그룹이 렌더링됨 */}
      {renderGroupA()}
      {renderGroupB()}
      {renderGroupC()}
      {renderGroupD()}

      {/* 색상 범례 */}
      {mode === "view" && (
        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            background: "#F9FAFB",
            borderRadius: "8px",
          }}
        >
          <p style={{ fontWeight: "bold", marginBottom: "10px" }}>범례:</p>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  background: "#10B981",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                }}
              ></div>
              <span>입실완료</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  background: "#F59E0B",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                }}
              ></div>
              <span>예약중</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  background: "#EF4444",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                }}
              ></div>
              <span>미입실</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  background: "white",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                }}
              ></div>
              <span>빈 좌석</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatGrid;
