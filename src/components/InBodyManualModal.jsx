import { useEffect, useRef, useState } from "react";
import { IoClose, IoCheckmark } from "react-icons/io5";
import "./InBodyManualModal.css";

export default function InBodyManualModal({
  isOpen,
  onClose,
  onSave,
  editData = null,
}) {
  const [formData, setFormData] = useState({
    // 기본 정보
    measurementDate: new Date().toISOString().split("T")[0],
    weight: "",
    muscleMass: "",
    bodyFatPercentage: "",
    basalMetabolicRate: "",

    // 체성분 분석
    bodyFatMass: "",
    skeletalMuscleMass: "",
    totalBodyWater: "",
    protein: "",
    mineral: "",

    // 비만 분석
    bmi: "",
    obesityDegree: "",
    bodyFatPercentageStandard: "",
    visceralFatLevel: "",

    // 부위별 근육량
    leftArmMuscle: "",
    rightArmMuscle: "",
    trunkMuscle: "",
    leftLegMuscle: "",
    rightLegMuscle: "",

    // 부위별 지방량
    leftArmFat: "",
    rightArmFat: "",
    trunkFat: "",
    leftLegFat: "",
    rightLegFat: "",
  });

  const firstInputRef = useRef(null);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (isOpen && editData) {
      setFormData({
        measurementDate:
          editData.measurementDate || new Date().toISOString().split("T")[0],
        weight: editData.weight?.toString() || "",
        muscleMass: editData.muscleMass?.toString() || "",
        bodyFatPercentage: editData.bodyFatPercentage?.toString() || "",
        basalMetabolicRate: editData.basalMetabolicRate?.toString() || "",
        bodyFatMass: editData.bodyFatMass?.toString() || "",
        skeletalMuscleMass: editData.skeletalMuscleMass?.toString() || "",
        totalBodyWater: editData.totalBodyWater?.toString() || "",
        protein: editData.protein?.toString() || "",
        mineral: editData.mineral?.toString() || "",
        bmi: editData.bmi?.toString() || "",
        obesityDegree: editData.obesityDegree?.toString() || "",
        bodyFatPercentageStandard:
          editData.bodyFatPercentageStandard?.toString() || "",
        visceralFatLevel: editData.visceralFatLevel?.toString() || "",
        leftArmMuscle: editData.leftArmMuscle?.toString() || "",
        rightArmMuscle: editData.rightArmMuscle?.toString() || "",
        trunkMuscle: editData.trunkMuscle?.toString() || "",
        leftLegMuscle: editData.leftLegMuscle?.toString() || "",
        rightLegMuscle: editData.rightLegMuscle?.toString() || "",
        leftArmFat: editData.leftArmFat?.toString() || "",
        rightArmFat: editData.rightArmFat?.toString() || "",
        trunkFat: editData.trunkFat?.toString() || "",
        leftLegFat: editData.leftLegFat?.toString() || "",
        rightLegFat: editData.rightLegFat?.toString() || "",
      });
    } else if (isOpen) {
      // 새로 추가하는 경우 초기화
      setFormData({
        measurementDate: new Date().toISOString().split("T")[0],
        weight: "",
        muscleMass: "",
        bodyFatPercentage: "",
        basalMetabolicRate: "",
        bodyFatMass: "",
        skeletalMuscleMass: "",
        totalBodyWater: "",
        protein: "",
        mineral: "",
        bmi: "",
        obesityDegree: "",
        bodyFatPercentageStandard: "",
        visceralFatLevel: "",
        leftArmMuscle: "",
        rightArmMuscle: "",
        trunkMuscle: "",
        leftLegMuscle: "",
        rightLegMuscle: "",
        leftArmFat: "",
        rightArmFat: "",
        trunkFat: "",
        leftLegFat: "",
        rightLegFat: "",
      });
    }
  }, [isOpen, editData]);

  useEffect(() => {
    if (isOpen) {
      // 모달 열리면 첫 입력에 포커스
      setTimeout(() => firstInputRef.current?.focus(), 0);
      // 스크롤 잠금
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // 체지방량 자동 계산
  useEffect(() => {
    if (formData.weight && formData.bodyFatPercentage) {
      const weight = parseFloat(formData.weight);
      const bodyFatPercentage = parseFloat(formData.bodyFatPercentage);
      if (!isNaN(weight) && !isNaN(bodyFatPercentage)) {
        const bodyFatMass = (weight * (bodyFatPercentage / 100)).toFixed(1);
        setFormData((prev) => ({ ...prev, bodyFatMass }));
      }
    }
  }, [formData.weight, formData.bodyFatPercentage]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const parseNumber = (v) => {
    const n = v === "" ? NaN : Number(v);
    return Number.isNaN(n) ? NaN : n;
  };

  const handleSave = () => {
    // 필수값 확인 (기본 정보만)
    const required = [
      "weight",
      "muscleMass",
      "bodyFatPercentage",
      "basalMetabolicRate",
      "measurementDate",
    ];

    for (const k of required) {
      if (!formData[k]) {
        alert("필수 필드를 모두 입력해주세요.");
        return;
      }
    }

    // 숫자 변환 (모든 필드)
    const numericFields = [
      "weight",
      "muscleMass",
      "bodyFatPercentage",
      "basalMetabolicRate",
      "bodyFatMass",
      "skeletalMuscleMass",
      "totalBodyWater",
      "protein",
      "mineral",
      "bmi",
      "obesityDegree",
      "bodyFatPercentageStandard",
      "visceralFatLevel",
      "leftArmMuscle",
      "rightArmMuscle",
      "trunkMuscle",
      "leftLegMuscle",
      "rightLegMuscle",
      "leftArmFat",
      "rightArmFat",
      "trunkFat",
      "leftLegFat",
      "rightLegFat",
    ];

    const result = {
      measurementDate: formData.measurementDate,
    };

    for (const field of numericFields) {
      if (formData[field]) {
        const num = parseNumber(formData[field]);
        if (Number.isNaN(num)) {
          alert(`${field} 필드의 숫자 형식이 올바르지 않습니다.`);
          return;
        }
        result[field] = num;
      }
    }

    // 기본 유효성 검사
    if (result.weight <= 0) {
      alert("체중은 0보다 커야 합니다.");
      return;
    }
    if (result.bodyFatPercentage < 0 || result.bodyFatPercentage > 70) {
      alert("체지방률은 0~70% 범위여야 합니다.");
      return;
    }

    onSave(result);
  };

  const isFormValid =
    formData.weight &&
    formData.muscleMass &&
    formData.bodyFatPercentage &&
    formData.basalMetabolicRate;

  const onOverlayClick = (e) => {
    if (e.target.classList.contains("inbody-manual-modal-overlay")) {
      onClose?.();
    }
  };

  return (
    <div
      className="inbody-manual-modal-overlay"
      onClick={onOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inbody-manual-title"
    >
      <div className="inbody-manual-modal-content">
        <div className="inbody-manual-modal-header">
          <h2 id="inbody-manual-title" className="inbody-manual-modal-title">
            {editData ? "인바디 수정" : "수기 입력"}
          </h2>
          <button
            className="inbody-manual-modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            <IoClose />
          </button>
        </div>

        <div className="inbody-manual-modal-body">
          {/* 기본 정보 */}
          <div className="form-section">
            <h3 className="section-title">📋 기본 정보</h3>

            <div className="form-group">
              <label className="form-label">측정 날짜 *</label>
              <input
                type="date"
                className="form-input"
                value={formData.measurementDate}
                onChange={(e) =>
                  handleInputChange("measurementDate", e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">체중 (kg) *</label>
              <input
                ref={firstInputRef}
                type="number"
                className="form-input"
                placeholder="예: 70.5"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">근육량 (kg) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 35.2"
                value={formData.muscleMass}
                onChange={(e) =>
                  handleInputChange("muscleMass", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">체지방률 (%) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 15.3"
                value={formData.bodyFatPercentage}
                onChange={(e) =>
                  handleInputChange("bodyFatPercentage", e.target.value)
                }
                step="0.1"
                min="0"
                max="100"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">기초대사량 (kcal) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 1650"
                value={formData.basalMetabolicRate}
                onChange={(e) =>
                  handleInputChange("basalMetabolicRate", e.target.value)
                }
                step="1"
                min="0"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* 체성분 분석 */}
          <div className="form-section">
            <h3 className="section-title">🔬 체성분 분석</h3>

            <div className="form-group">
              <label className="form-label">체지방량 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="자동 계산됨"
                value={formData.bodyFatMass}
                onChange={(e) =>
                  handleInputChange("bodyFatMass", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
                readOnly
                aria-readonly="true"
              />
            </div>

            <div className="form-group">
              <label className="form-label">골격근량 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 30.5"
                value={formData.skeletalMuscleMass}
                onChange={(e) =>
                  handleInputChange("skeletalMuscleMass", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">총체수분 (L)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 42.3"
                value={formData.totalBodyWater}
                onChange={(e) =>
                  handleInputChange("totalBodyWater", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">단백질 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 11.2"
                value={formData.protein}
                onChange={(e) => handleInputChange("protein", e.target.value)}
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">무기질 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 3.8"
                value={formData.mineral}
                onChange={(e) => handleInputChange("mineral", e.target.value)}
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>
          </div>

          {/* 비만 분석 */}
          <div className="form-section">
            <h3 className="section-title">📊 비만 분석</h3>

            <div className="form-group">
              <label className="form-label">BMI</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 23.5"
                value={formData.bmi}
                onChange={(e) => handleInputChange("bmi", e.target.value)}
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">비만도 (%)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 95.2"
                value={formData.obesityDegree}
                onChange={(e) =>
                  handleInputChange("obesityDegree", e.target.value)
                }
                step="0.1"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">표준 체지방률 (%)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 18.0"
                value={formData.bodyFatPercentageStandard}
                onChange={(e) =>
                  handleInputChange("bodyFatPercentageStandard", e.target.value)
                }
                step="0.1"
                min="0"
                max="100"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">내장지방 레벨</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 5"
                value={formData.visceralFatLevel}
                onChange={(e) =>
                  handleInputChange("visceralFatLevel", e.target.value)
                }
                step="1"
                min="0"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* 부위별 근육량 */}
          <div className="form-section">
            <h3 className="section-title">💪 부위별 근육량</h3>

            <div className="form-group">
              <label className="form-label">왼팔 근육 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 2.8"
                value={formData.leftArmMuscle}
                onChange={(e) =>
                  handleInputChange("leftArmMuscle", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">오른팔 근육 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 2.9"
                value={formData.rightArmMuscle}
                onChange={(e) =>
                  handleInputChange("rightArmMuscle", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">몸통 근육 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 24.5"
                value={formData.trunkMuscle}
                onChange={(e) =>
                  handleInputChange("trunkMuscle", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">왼다리 근육 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 8.5"
                value={formData.leftLegMuscle}
                onChange={(e) =>
                  handleInputChange("leftLegMuscle", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">오른다리 근육 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 8.6"
                value={formData.rightLegMuscle}
                onChange={(e) =>
                  handleInputChange("rightLegMuscle", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>
          </div>

          {/* 부위별 지방량 */}
          <div className="form-section">
            <h3 className="section-title">🔥 부위별 지방량</h3>

            <div className="form-group">
              <label className="form-label">왼팔 지방 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 0.8"
                value={formData.leftArmFat}
                onChange={(e) =>
                  handleInputChange("leftArmFat", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">오른팔 지방 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 0.8"
                value={formData.rightArmFat}
                onChange={(e) =>
                  handleInputChange("rightArmFat", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">몸통 지방 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 7.2"
                value={formData.trunkFat}
                onChange={(e) => handleInputChange("trunkFat", e.target.value)}
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">왼다리 지방 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 2.5"
                value={formData.leftLegFat}
                onChange={(e) =>
                  handleInputChange("leftLegFat", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">오른다리 지방 (kg)</label>
              <input
                type="number"
                className="form-input"
                placeholder="예: 2.5"
                value={formData.rightLegFat}
                onChange={(e) =>
                  handleInputChange("rightLegFat", e.target.value)
                }
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>
          </div>

          {/* 도움말 */}
          <div className="help-section">
            <h3 className="help-title">💡 도움말</h3>
            <ul className="help-list">
              <li>* 표시된 필드는 필수 입력 항목입니다</li>
              <li>체지방량은 체중과 체지방률로 자동 계산됩니다</li>
              <li>정확한 측정을 위해 아침 공복 상태에서 측정하세요</li>
              <li>측정 전 화장실을 다녀오세요</li>
              <li>운동 전후는 측정하지 마세요</li>
            </ul>
          </div>
        </div>

        <div className="inbody-manual-modal-footer">
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!isFormValid}
          >
            <IoCheckmark />
            {editData ? "수정하기" : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
