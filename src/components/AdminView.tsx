import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Student, User } from "../App";

interface AdminViewProps {
  loggedInUser: User | null;
  students: Student[];
  currentDate: string;
  onDataChange: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({
  loggedInUser,
  students,
  currentDate,
  onDataChange,
}) => {
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  if (!loggedInUser || loggedInUser.role !== "admin") {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>관리자 로그인이 필요합니다.</p>
      </div>
    );
  }

  // 🔐 비밀번호 초기화 함수
  const resetPassword = async (student: Student) => {
    const defaultPassword = "0000"; // 초기 비밀번호

    if (
      !window.confirm(
        `${student.name} (${student.grade}학년 ${student.class}반 ${student.number}번) 학생의 비밀번호를 초기화하시겠습니까?\n\n초기 비밀번호: ${defaultPassword}`
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("students")
        .update({ password: defaultPassword })
        .eq("id", student.id);

      if (error) throw error;

      alert(
        `✅ ${student.name} 학생의 비밀번호가 "${defaultPassword}"로 초기화되었습니다.\n\n학생에게 초기 비밀번호를 안내해주세요.`
      );
      await onDataChange();
    } catch (error) {
      console.error("비밀번호 초기화 오류:", error);
      alert("비밀번호 초기화에 실패했습니다.");
    }
  };

  const downloadExcel = () => {
    const csv = [
      ["학년", "반", "번호", "이름", "바코드", "비밀번호", "고정좌석"].join(
        ","
      ),
      ...students.map((s) =>
        [
          s.grade,
          s.class,
          s.number,
          s.name,
          s.barcode,
          s.password || "",
          s.fixed_seat_id || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `학생명단_${currentDate}.csv`;
    link.click();
    alert("학생 명단이 다운로드되었습니다.");
  };

  const uploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split("\n").slice(1);
        const newStudents = rows
          .map((row) => {
            const [
              grade,
              classNum,
              number,
              name,
              barcode,
              password,
              fixedSeatId,
            ] = row.split(",");
            const id = `${grade}${classNum}${String(number).padStart(2, "0")}`;
            return {
              id,
              grade: parseInt(grade),
              class: parseInt(classNum),
              number: parseInt(number),
              name: name?.trim(),
              barcode: barcode?.trim(),
              password: password?.trim() || "0000",
              fixed_seat_id: fixedSeatId?.trim() || null,
            };
          })
          .filter((s) => s.name && s.barcode);

        if (newStudents.length === 0) {
          alert("유효한 데이터가 없습니다.");
          return;
        }

        const confirmMsg = `${newStudents.length}명의 학생 데이터를 업로드합니다.\n\n⚠️ 주의: 기존 학생 명단은 삭제되고 새 명단으로 교체됩니다.\n\n계속하시겠습니까?`;

        if (!window.confirm(confirmMsg)) {
          return;
        }

        const { error: deleteError } = await supabase
          .from("students")
          .delete()
          .neq("id", "");

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from("students")
          .insert(newStudents);

        if (insertError) throw insertError;

        alert(
          `✅ ${newStudents.length}명의 학생 데이터가 업로드되었습니다.\n\n💡 참고: 예약/사유 데이터는 유지됩니다.`
        );
        onDataChange();
      } catch (error) {
        console.error("업로드 오류:", error);
        alert("업로드에 실패했습니다. CSV 형식을 확인해주세요.");
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteOldData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      const cutoffDate = `${lastYear}-12-31`;

      const { count: resCount } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .lte("date", cutoffDate);

      const { count: absCount } = await supabase
        .from("absences")
        .select("*", { count: "exact", head: true })
        .lte("date", cutoffDate);

      const totalCount = (resCount || 0) + (absCount || 0);

      if (totalCount === 0) {
        alert("삭제할 전년도 데이터가 없습니다.");
        return;
      }

      const confirmMsg = `${lastYear}년 이전 데이터 ${totalCount}건을 삭제하시겠습니까?\n\n포함 내역:\n- 예약 데이터: ${resCount}건\n- 사유 데이터: ${absCount}건\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`;

      if (!window.confirm(confirmMsg)) {
        setShowCleanupConfirm(false);
        return;
      }

      const { error: resError } = await supabase
        .from("reservations")
        .delete()
        .lte("date", cutoffDate);

      if (resError) throw resError;

      const { error: absError } = await supabase
        .from("absences")
        .delete()
        .lte("date", cutoffDate);

      if (absError) throw absError;

      alert(`✅ ${lastYear}년 이전 데이터 ${totalCount}건이 삭제되었습니다.`);
      setShowCleanupConfirm(false);
      onDataChange();
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("데이터 삭제에 실패했습니다.");
    }
  };

  const handlePromote = async () => {
    try {
      const grade1Students = students.filter((s) => s.grade === 1);
      const grade2Students = students.filter((s) => s.grade === 2);
      const grade3Students = students.filter((s) => s.grade === 3);

      const confirmMsg = `학생 진급을 진행합니다.\n\n📊 현황:\n- 1학년 → 2학년: ${grade1Students.length}명\n- 2학년 → 3학년: ${grade2Students.length}명\n- 3학년 졸업 삭제: ${grade3Students.length}명\n\n⚠️ 추가 작업:\n- 전년도 예약/사유 데이터 삭제\n- 고정 좌석 정보 초기화\n\n이 작업은 되돌릴 수 없습니다!\n계속하시겠습니까?`;

      if (!window.confirm(confirmMsg)) {
        setShowPromoteConfirm(false);
        return;
      }

      if (grade3Students.length > 0) {
        const grade3Ids = grade3Students.map((s) => s.id);
        const { error: deleteError } = await supabase
          .from("students")
          .delete()
          .in("id", grade3Ids);

        if (deleteError) throw deleteError;
      }

      if (grade2Students.length > 0) {
        for (const student of grade2Students) {
          const newId = `3${student.class}${String(student.number).padStart(
            2,
            "0"
          )}`;
          const { error } = await supabase
            .from("students")
            .update({
              grade: 3,
              id: newId,
              fixed_seat_id: null,
            })
            .eq("id", student.id);

          if (error) throw error;
        }
      }

      if (grade1Students.length > 0) {
        for (const student of grade1Students) {
          const newId = `2${student.class}${String(student.number).padStart(
            2,
            "0"
          )}`;
          const { error } = await supabase
            .from("students")
            .update({
              grade: 2,
              id: newId,
              fixed_seat_id: null,
            })
            .eq("id", student.id);

          if (error) throw error;
        }
      }

      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      const cutoffDate = `${lastYear}-12-31`;

      await supabase.from("reservations").delete().lte("date", cutoffDate);
      await supabase.from("absences").delete().lte("date", cutoffDate);

      alert(
        `✅ 진급 처리가 완료되었습니다!\n\n처리 내역:\n- 1학년 → 2학년: ${grade1Students.length}명\n- 2학년 → 3학년: ${grade2Students.length}명\n- 3학년 졸업: ${grade3Students.length}명\n- 전년도 데이터 삭제 완료`
      );
      setShowPromoteConfirm(false);
      onDataChange();
    } catch (error) {
      console.error("진급 처리 오류:", error);
      alert("진급 처리에 실패했습니다.");
    }
  };

  const handleDeleteAll = async () => {
    try {
      const studentCount = students.length;

      const { count: resCount } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true });

      const { count: absCount } = await supabase
        .from("absences")
        .select("*", { count: "exact", head: true });

      const confirmMsg = `⚠️⚠️⚠️ 경고 ⚠️⚠️⚠️\n\n모든 데이터를 삭제합니다!\n\n삭제될 데이터:\n- 학생 명단: ${studentCount}명\n- 예약 데이터: ${resCount}건\n- 사유 데이터: ${absCount}건\n\n이 작업은 절대 되돌릴 수 없습니다!\n\n정말로 모든 데이터를 삭제하시겠습니까?`;

      if (!window.confirm(confirmMsg)) {
        setShowDeleteAllConfirm(false);
        return;
      }

      const finalConfirm = window.prompt(
        '정말로 삭제하시려면 "삭제확인"을 입력하세요:'
      );

      if (finalConfirm !== "삭제확인") {
        alert("취소되었습니다.");
        setShowDeleteAllConfirm(false);
        return;
      }

      await supabase.from("reservations").delete().neq("id", 0);
      await supabase.from("absences").delete().neq("id", 0);
      await supabase.from("students").delete().neq("id", "");

      alert("✅ 모든 데이터가 삭제되었습니다.");
      setShowDeleteAllConfirm(false);
      onDataChange();
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("데이터 삭제에 실패했습니다.");
    }
  };

  const isMobile = window.innerWidth < 768;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const showCleanupNotice = currentMonth >= 2 && currentMonth <= 3;

  return (
    <div style={{ padding: "15px", maxWidth: "1400px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          marginBottom: "20px",
          gap: "10px",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
          학생 명단 관리
        </h1>
      </div>

      {showCleanupNotice && (
        <div
          style={{
            background: "#FEF3C7",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "15px",
            border: "2px solid #F59E0B",
          }}
        >
          <p style={{ fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
            🎓 <strong>학년 말 데이터 관리 안내</strong>
            <br />
            현재 {currentYear}년 {currentMonth}월입니다. 학년 말 진급 처리 및
            데이터 정리를 진행해주세요.
            <br />
            <span style={{ fontSize: "13px", color: "#92400E" }}>
              ※ 진급 버튼 클릭 시 전년도 데이터 자동 삭제 및 고정 좌석 초기화
            </span>
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            border: "2px solid #3B82F6",
            borderRadius: "12px",
            padding: "15px",
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "bold",
              marginBottom: "12px",
              color: "#3B82F6",
            }}
          >
            📋 명단 관리
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              style={{
                padding: "10px",
                background: "#10B981",
                color: "white",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              📤 CSV 업로드
              <input
                type="file"
                accept=".csv"
                onChange={uploadExcel}
                style={{ display: "none" }}
              />
            </label>
            <button
              onClick={downloadExcel}
              style={{
                padding: "10px",
                background: "#3B82F6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              📥 CSV 다운로드
            </button>
          </div>
        </div>

        <div
          style={{
            border: "2px solid #8B5CF6",
            borderRadius: "12px",
            padding: "15px",
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "bold",
              marginBottom: "12px",
              color: "#8B5CF6",
            }}
          >
            🎓 진급 처리
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={() => setShowPromoteConfirm(true)}
              style={{
                padding: "10px",
                background: "#8B5CF6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              ⬆️ 일괄 진급
            </button>
            <div
              style={{ fontSize: "12px", color: "#6B7280", lineHeight: "1.4" }}
            >
              • 1→2, 2→3학년
              <br />• 3학년 졸업 삭제
            </div>
          </div>
        </div>

        <div
          style={{
            border: "2px solid #EF4444",
            borderRadius: "12px",
            padding: "15px",
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "bold",
              marginBottom: "12px",
              color: "#EF4444",
            }}
          >
            🗑️ 데이터 관리
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={() => setShowCleanupConfirm(true)}
              style={{
                padding: "10px",
                background: "#F59E0B",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              📅 전년도 데이터 삭제
            </button>
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              style={{
                padding: "10px",
                background: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              ⚠️ 전체 삭제
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#FEF3C7",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "15px",
        }}
      >
        <p style={{ fontSize: "13px", margin: 0, lineHeight: "1.4" }}>
          💡 CSV 형식: 학년,반,번호,이름,바코드,비밀번호,고정좌석
          <br />
          <span style={{ fontSize: "12px", color: "#92400E" }}>
            ※ 학생 명단 업로드 시 기존 명단은 삭제되지만, 예약/사유 기록은
            유지됩니다.
          </span>
        </p>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          overflow: "auto",
          border: "1px solid #ddd",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "700px",
          }}
        >
          <thead>
            <tr style={{ background: "#F3F4F6" }}>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  borderBottom: "2px solid #ddd",
                  fontSize: "14px",
                }}
              >
                학년
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  borderBottom: "2px solid #ddd",
                  fontSize: "14px",
                }}
              >
                반
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  borderBottom: "2px solid #ddd",
                  fontSize: "14px",
                }}
              >
                번호
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "left",
                  borderBottom: "2px solid #ddd",
                  fontSize: "14px",
                }}
              >
                이름
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "left",
                  borderBottom: "2px solid #ddd",
                  fontSize: "14px",
                }}
              >
                바코드
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  borderBottom: "2px solid #ddd",
                  fontSize: "14px",
                }}
              >
                비밀번호
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  borderBottom: "2px solid #ddd",
                  fontSize: "14px",
                }}
              >
                고정좌석
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  borderBottom: "2px solid #ddd",
                  fontSize: "14px",
                }}
              >
                비밀번호 관리
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => (
              <tr
                key={s.id}
                style={{ background: idx % 2 === 0 ? "white" : "#F9FAFB" }}
              >
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "center",
                    borderBottom: "1px solid #E5E7EB",
                    fontSize: "14px",
                  }}
                >
                  {s.grade}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "center",
                    borderBottom: "1px solid #E5E7EB",
                    fontSize: "14px",
                  }}
                >
                  {s.class}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "center",
                    borderBottom: "1px solid #E5E7EB",
                    fontSize: "14px",
                  }}
                >
                  {s.number}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    borderBottom: "1px solid #E5E7EB",
                    fontSize: "14px",
                  }}
                >
                  {s.name}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  {s.barcode}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "center",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  {s.password || "****"}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "center",
                    fontSize: "13px",
                    borderBottom: "1px solid #E5E7EB",
                    color: s.fixed_seat_id ? "#10B981" : "#999",
                    fontWeight: s.fixed_seat_id ? "bold" : "normal",
                  }}
                >
                  {s.fixed_seat_id || "-"}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "center",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  <button
                    onClick={() => resetPassword(s)}
                    style={{
                      padding: "6px 12px",
                      background: "#F59E0B",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    🔐 초기화
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: "15px",
          textAlign: "center",
          color: "#666",
          fontSize: "14px",
        }}
      >
        총 {students.length}명 (1학년:{" "}
        {students.filter((s) => s.grade === 1).length}
        명, 2학년: {students.filter((s) => s.grade === 2).length}명, 3학년:{" "}
        {students.filter((s) => s.grade === 3).length}명)
      </div>

      {/* 모달들은 생략 (기존 코드와 동일) */}
    </div>
  );
};

export default AdminView;
