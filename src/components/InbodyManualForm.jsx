import { useMemo, useState } from "react";

export default function InbodyManualForm({ onSubmit }) {
  const [v, setV] = useState({
    date: new Date().toISOString().slice(0, 10),
    gender: "female",
    age: "",
    height: "", // cm
    weight: "", // kg
    smm: "", // 골격근량 kg
    bfm: "", // 체지방량 kg
    pbf: "", // 체지방률 %
    score: "", // 인바디 점수
    vfa: "", // 내장지방면적 cm^2
    bmr: "", // kcal
    rArm: "",
    lArm: "",
    trunk: "",
    rLeg: "",
    lLeg: "", // 부위별 근육량 kg
    ecw: "", // ECW/TBW ratio
    wtCtrl: "",
    fatCtrl: "",
    musCtrl: "", // 체중/지방/근육 조절 kg
  });

  const bmi = useMemo(() => {
    const h = parseFloat(v.height);
    const w = parseFloat(v.weight);
    if (!h || !w) return "";
    const m = h / 100;
    return (w / (m * m)).toFixed(1);
  }, [v.height, v.weight]);

  const handle = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...v, bmi };
    onSubmit?.(payload);
    alert("저장 가정: 콘솔을 확인하세요.");
    console.log("InBody Manual Payload:", payload);
  };

  const numProps = {
    inputMode: "decimal",
    pattern: "[0-9]*([.][0-9]+)?",
    min: "0",
  };

  return (
    <form onSubmit={submit} style={styles.wrap}>
      <h2 style={styles.h2}>인바디 수기 입력</h2>

      {/* 기본 정보 */}
      <section style={styles.sec}>
        <Field label="검사일">
          <input
            type="date"
            value={v.date}
            onChange={handle("date")}
            style={styles.inp}
          />
        </Field>
        <Field label="성별">
          <div style={styles.row}>
            <label style={styles.radio}>
              <input
                type="radio"
                name="gender"
                checked={v.gender === "male"}
                onChange={() => setV((s) => ({ ...s, gender: "male" }))}
              />
              남성
            </label>
            <label style={styles.radio}>
              <input
                type="radio"
                name="gender"
                checked={v.gender === "female"}
                onChange={() => setV((s) => ({ ...s, gender: "female" }))}
              />
              여성
            </label>
          </div>
        </Field>
        <Field label="나이">
          <Unit>
            <input
              {...numProps}
              value={v.age}
              onChange={handle("age")}
              style={styles.inpRight}
            />
            <span style={styles.unit}>세</span>
          </Unit>
        </Field>
        <Field label="신장">
          <Unit>
            <input
              {...numProps}
              value={v.height}
              onChange={handle("height")}
              style={styles.inpRight}
            />
            <span style={styles.unit}>cm</span>
          </Unit>
        </Field>
      </section>

      {/* 핵심 수치 */}
      <section style={styles.sec}>
        <Field label="체중">
          <Unit>
            <input
              {...numProps}
              value={v.weight}
              onChange={handle("weight")}
              style={styles.inpRight}
            />
            <span style={styles.unit}>kg</span>
          </Unit>
        </Field>
        <Field label="골격근량(SMM)">
          <Unit>
            <input
              {...numProps}
              value={v.smm}
              onChange={handle("smm")}
              style={styles.inpRight}
            />
            <span style={styles.unit}>kg</span>
          </Unit>
        </Field>
        <Field label="체지방량(BFM)">
          <Unit>
            <input
              {...numProps}
              value={v.bfm}
              onChange={handle("bfm")}
              style={styles.inpRight}
            />
            <span style={styles.unit}>kg</span>
          </Unit>
        </Field>
        <Field label="체지방률(PBF)">
          <Unit>
            <input
              {...numProps}
              value={v.pbf}
              onChange={handle("pbf")}
              style={styles.inpRight}
            />
            <span style={styles.unit}>%</span>
          </Unit>
        </Field>
        <Field label="BMI">
          <Unit>
            <input
              value={bmi}
              readOnly
              style={{ ...styles.inpRight, background: "#2b2b2b" }}
            />
            <span style={styles.unit}>kg/m²</span>
          </Unit>
        </Field>
      </section>

      {/* 점수/내장지방/BMR */}
      <section style={styles.sec}>
        <Field label="인바디 점수">
          <input
            {...numProps}
            value={v.score}
            onChange={handle("score")}
            style={styles.inp}
          />
        </Field>
        <Field label="내장지방면적(VFA)">
          <Unit>
            <input
              {...numProps}
              value={v.vfa}
              onChange={handle("vfa")}
              style={styles.inpRight}
            />
            <span style={styles.unit}>cm²</span>
          </Unit>
        </Field>
        <Field label="BMR">
          <Unit>
            <input
              {...numProps}
              value={v.bmr}
              onChange={handle("bmr")}
              style={styles.inpRight}
            />
            <span style={styles.unit}>kcal</span>
          </Unit>
        </Field>
      </section>

      {/* 부위별 근육량 */}
      <section style={styles.sec}>
        <h3 style={styles.h3}>부위별 근육량 (kg)</h3>
        <div style={styles.grid}>
          <Small label="오른팔" v={v.rArm} onChange={handle("rArm")} />
          <Small label="왼팔" v={v.lArm} onChange={handle("lArm")} />
          <Small label="몸통" v={v.trunk} onChange={handle("trunk")} />
          <Small label="오른다리" v={v.rLeg} onChange={handle("rLeg")} />
          <Small label="왼다리" v={v.lLeg} onChange={handle("lLeg")} />
        </div>
      </section>

      {/* 수분비/체중조절 */}
      <section style={styles.sec}>
        <Field label="세포외수분비(ECW/TBW)">
          <input
            {...numProps}
            value={v.ecw}
            onChange={handle("ecw")}
            style={styles.inp}
          />
        </Field>
        <div style={styles.grid2}>
          <Field label="체중조절(±kg)">
            <Unit>
              <input
                {...numProps}
                value={v.wtCtrl}
                onChange={handle("wtCtrl")}
                style={styles.inpRight}
              />
              <span style={styles.unit}>kg</span>
            </Unit>
          </Field>
          <Field label="지방조절(kg)">
            <Unit>
              <input
                {...numProps}
                value={v.fatCtrl}
                onChange={handle("fatCtrl")}
                style={styles.inpRight}
              />
              <span style={styles.unit}>kg</span>
            </Unit>
          </Field>
          <Field label="근육조절(kg)">
            <Unit>
              <input
                {...numProps}
                value={v.musCtrl}
                onChange={handle("musCtrl")}
                style={styles.inpRight}
              />
              <span style={styles.unit}>kg</span>
            </Unit>
          </Field>
        </div>
      </section>

      <button type="submit" style={styles.submit}>
        저장
      </button>
    </form>
  );
}

/* ---------- 작은 구성 요소 ---------- */
function Field({ label, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.lab}>{label}</span>
      {children}
    </label>
  );
}
function Unit({ children }) {
  return <div style={styles.unitBox}>{children}</div>;
}
function Small({ label, v, onChange }) {
  const numProps = {
    inputMode: "decimal",
    pattern: "[0-9]*([.][0-9]+)?",
    min: "0",
  };
  return (
    <label style={styles.smallField}>
      <span style={styles.smallLab}>{label}</span>
      <div style={styles.unitBox}>
        <input
          {...numProps}
          value={v}
          onChange={onChange}
          style={styles.inpRight}
        />
        <span style={styles.unit}>kg</span>
      </div>
    </label>
  );
}

/* ---------- 스타일 ---------- */
const styles = {
  wrap: {
    width: 400,
    maxWidth: "100%",
    background: "#1b1b1b",
    color: "#f3f3f3",
    borderRadius: 16,
    padding: 16,
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
  },
  h2: { margin: "0 0 6px", fontSize: 16, fontWeight: 700 },
  h3: { margin: "6px 0 6px", fontSize: 13, color: "#c9c9c9" },
  sec: { borderTop: "1px solid #2a2a2a", paddingTop: 8, marginTop: 8 },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 8,
  },
  lab: {
    fontSize: 11,
    color: "#bdbdbd",
    marginBottom: 2,
  },
  inp: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #343434",
    background: "#242424",
    color: "#fff",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
  },
  inpRight: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #343434",
    background: "#242424",
    color: "#fff",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
  },
  unitBox: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  unit: {
    padding: "4px 6px",
    borderRadius: 6,
    background: "#2b2b2b",
    color: "#d5d5d5",
    fontSize: 11,
    border: "1px solid #353535",
    whiteSpace: "nowrap",
  },
  row: {
    display: "flex",
    gap: 16,
    marginTop: 4,
  },
  radio: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 13,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8,
  },
  smallField: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  smallLab: {
    fontSize: 11,
    color: "#bdbdbd",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8,
    marginTop: 4,
  },
  submit: {
    marginTop: 16,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "#d6ff4b",
    color: "#111",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    boxSizing: "border-box",
  },
};
