import React from "react";
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
  if (!loggedInUser || loggedInUser.role !== "admin") {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>관리자 로그인이 필요합니다.</p>
      </div>
    );
  }

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

        const { error: deleteError } = await supabase
          .from("students")
          .delete()
          .neq("id", "");

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from("students")
          .insert(newStudents);

        if (insertError) throw insertError;

        alert(`${newStudents.length}명의 학생 데이터가 업로드되었습니다.`);
        onDataChange();
      } catch (error) {
        console.error("업로드 오류:", error);
        alert("업로드에 실패했습니다. CSV 형식을 확인해주세요.");
      }
    };
    reader.readAsText(file);
  };

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{ padding: "15px", maxWidth: "1200px", margin: "0 auto" }}>
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
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <label
            style={{
              padding: "10px 16px",
              background: "#10B981",
              color: "white",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              flex: isMobile ? "1" : "auto",
              justifyContent: "center",
            }}
          >
            📤 업로드
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
              padding: "10px 16px",
              background: "#3B82F6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              flex: isMobile ? "1" : "auto",
              justifyContent: "center",
            }}
          >
            📥 다운로드
          </button>
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
            minWidth: "600px",
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
        총 {students.length}명
      </div>
    </div>
  );
};

export default AdminView;
