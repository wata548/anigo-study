import React from "react";
import { Seat, Reservation } from "../App";

interface SeatGridProps {
  seats: Seat[];
  reservations: Reservation[];
  currentDate: string;
  grade: number;
  onSeatClick?: (seatId: string) => void;
  selectedSeat?: string;
  mode: "view" | "select"; // view: 대시보드, select: 예약 선택
  loggedInStudentId?: string;
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
}) => {
  const isMobile = window.innerWidth < 768;

  // 좌석 클릭 가능 여부 확인
  const isSeatClickable = (seatId: string) => {
    if (mode === "view") return false;

    const reservation = reservations.find(
      (r) => r.seat_id === seatId && r.date === currentDate
    );

    if (!reservation) {
      // 빈 좌석은 클릭 가능
      return true;
    }

    // 예약 기록이 있는 경우:
    // 1. 입실 완료 상태는 클릭 불가능 (예약 화면에서는 변경 불가)
    if (reservation.status === "입실완료") {
      return false;
    }

    // 2. 예약, 미입실 상태는 클릭 가능
    if (reservation.status === "예약" || reservation.status === "미입실") {
      return true;
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
      if (selectedSeat === seatId) return "#3B82F6"; // 선택된 좌석은 파랑

      const reservation = reservations.find(
        (r) => r.seat_id === seatId && r.date === currentDate
      );

      const status = reservation?.status || "empty";
      const isMyReservation = reservation?.student_id === loggedInStudentId;

      if (status === "empty") return "white"; // 빈 좌석은 흰색

      if (status === "예약" || status === "미입실") {
        // 본인 예약(예약/미입실)은 밝은 색으로 표시하여 선택 가능함을 시각적으로 나타냅니다.
        // 타인 예약은 노랑 계열로, 본인 예약과 구분합니다.
        return isMyReservation ? "#CFFDF2" : "#FEF3C7";
      }

      if (status === "입실완료") return "#E5E7EB"; // 입실 완료 좌석은 회색 (클릭 불가능)

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
          {/* 1-10번 */}
          {groupBSeats.slice(0, 10).map((seat) => {
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

          {/* 11-20번 */}
          {groupBSeats.slice(10, 20).map((seat) => {
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

          {/* 21-30번 */}
          {groupBSeats.slice(20, 30).map((seat) => {
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

          {/* 31-39번 + 빈 칸 */}
          {groupBSeats.slice(30, 39).map((seat) => {
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
          {/* 39석이므로 마지막에 빈 칸 1개 (40번 자리) */}
          <div style={emptyStyle}></div>
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

    // C구역은 26석을 가정하고, 7*4=28칸 중 2칸이 비도록 구현합니다.

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
          {/* 1-7번 */}
          {groupCSeats.slice(0, 7).map((seat) => {
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

          {/* 8-14번 */}
          {groupCSeats.slice(7, 14).map((seat) => {
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

          {/* 15-21번 */}
          {groupCSeats.slice(14, 21).map((seat) => {
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

          {/* 4번째 줄: 빈칸 + 22-26번 + 빈칸 (총 5석만 렌더링) */}
          <div style={emptyStyle}></div>
          {groupCSeats.slice(21, 26).map((seat) => {
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
          <div style={emptyStyle}></div>
        </div>
      </div>
    );
  };

  // D구역: 2학년 오픈형 (2x2 테이블 3개, 3x2 테이블 1개 | 1x8줄 1개, 3x2 테이블 1개)
  const renderGroupD = () => {
    if (grade !== 2) return null;

    const groupDSeats = seats
      .filter((s) => s.group === "D" && s.grade === 2)
      .sort((a, b) => a.number - b.number);

    // D-1 ~ D-12: 2x2 테이블 3개 (12석)
    const table2x2_seats = groupDSeats.slice(0, 12);
    // D-13 ~ D-18: 상단 3x2 테이블 1개 (6석)
    const upperTableSeats = groupDSeats.slice(12, 18);
    // D-19 ~ D-26: 하단 1x8 줄 (8석)
    const lowerRowSeats = groupDSeats.slice(18, 26);
    // D-27 ~ D-32: 하단 3x2 테이블 1개 (6석)
    const lowerTableSeats = groupDSeats.slice(26, 32);

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

    // 상단 2x2 테이블 3개는 4열씩 3블록 (총 6열 + 2 간격)
    const table2x2_1 = table2x2_seats.slice(0, 4);
    const table2x2_2 = table2x2_seats.slice(4, 8);
    const table2x2_3 = table2x2_seats.slice(8, 12);

    // 3열 테이블의 고정 너비 (상하단 정렬 기준)
    const TABLE_3X2_WIDTH = "150px";
    // 2x2 테이블 3개의 컨테이너 너비
    const TABLE_2X2_CONTAINER_WIDTH = "380px";
    // 1x8 줄의 컨테이너 너비
    const ROW_1X8_CONTAINER_WIDTH = "440px";
    // 상하단 테이블 사이의 공통 간격
    const GAP_WIDTH = "30px";

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

        {/* --- 상단 배치 (D-1 ~ D-18): 2x2 테이블 3개 | 3x2 테이블 1개 --- */}
        <div
          style={{
            display: "flex",
            gap: GAP_WIDTH,
            alignItems: "flex-start",
            marginBottom: "20px",
            maxWidth: isMobile
              ? "100%"
              : `${
                  parseFloat(TABLE_2X2_CONTAINER_WIDTH) +
                  parseFloat(GAP_WIDTH) +
                  parseFloat(TABLE_3X2_WIDTH)
                }px`,
          }}
        >
          {/* 1. D-1 ~ D-12 (2x2 테이블 3개) 컨테이너 */}
          <div
            style={{
              display: "grid",
              // 2열, 간격(10px), 2열, 간격(10px), 2열
              gridTemplateColumns:
                "repeat(2, 1fr) 10px repeat(2, 1fr) 10px repeat(2, 1fr)",
              gap: "8px",
              flex: "none",
              width: TABLE_2X2_CONTAINER_WIDTH,
            }}
          >
            {/* D-1 ~ D-4 (2x2) */}
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

            {/* 2x2 테이블 사이의 수직 간격 */}
            <div style={{ gridColumn: "3", gridRow: "1 / 3" }}></div>

            {/* D-5 ~ D-8 (2x2) */}
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

            <div style={{ gridColumn: "6", gridRow: "1 / 3" }}></div>

            {/* D-9 ~ D-12 (2x2) */}
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

          {/* 2. D-13 ~ D-18 (3x2 테이블) 컨테이너: 우측 상단 정렬 기준 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
              flex: "none",
              width: TABLE_3X2_WIDTH, // 3열 테이블 너비 (하단과 정렬 기준)
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
        </div>

        {/* --- 하단 배치 (D-19 ~ D-32): 1x8 줄 1개 | 3x2 테이블 1개 --- */}
        <div
          style={{
            display: "flex",
            gap: GAP_WIDTH, // 상단과 동일한 간격
            alignItems: "flex-start",
            maxWidth: isMobile ? "100%" : "800px",
          }}
        >
          {/* 1. D-19 ~ D-26 (1x8 줄) 컨테이너 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)", // 8열
              gap: "8px",
              flex: "none",
              // 상단 2x2 컨테이너와 동일한 너비를 차지하도록 설정 (2x2 컨테이너 너비 + 1x8 줄 공간 확보)
              width: ROW_1X8_CONTAINER_WIDTH,
            }}
          >
            {lowerRowSeats.map((seat) => {
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

          {/* 2. D-27 ~ D-32 (3x2 테이블) 컨테이너 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
              flex: "none",
              width: TABLE_3X2_WIDTH, // 상단 3x2 테이블과 동일한 너비 (수직 정렬 핵심)
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
