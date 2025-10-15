import { useState } from "react";
import {
  IoClose,
  IoAddCircle,
  IoCard,
  IoCheckmarkCircle,
  IoTrash,
} from "react-icons/io5";
import "./PaymentMethodModal.css";

export default function PaymentMethodModal({ isOpen, onClose }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: "",
    expiryDate: "",
    cvc: "",
    cardholderName: "",
  });

  if (!isOpen) return null;

  // 등록된 결제 수단 샘플 데이터
  const paymentMethods = [
    {
      id: 1,
      type: "card",
      cardType: "신한카드",
      lastFourDigits: "1234",
      expiryDate: "12/25",
      isDefault: true,
    },
    {
      id: 2,
      type: "card",
      cardType: "국민카드",
      lastFourDigits: "5678",
      expiryDate: "08/26",
      isDefault: false,
    },
  ];

  const handleAddCard = () => {
    console.log("카드 추가:", newCard);
    alert("결제 수단이 추가되었습니다!");
    setShowAddForm(false);
    setNewCard({ cardNumber: "", expiryDate: "", cvc: "", cardholderName: "" });
  };

  const handleDeleteCard = (id) => {
    if (window.confirm("이 결제 수단을 삭제하시겠습니까?")) {
      console.log("카드 삭제:", id);
      alert("결제 수단이 삭제되었습니다.");
    }
  };

  const handleSetDefault = (id) => {
    console.log("기본 결제 수단 설정:", id);
    alert("기본 결제 수단이 변경되었습니다.");
  };

  const formatCardNumber = (value) => {
    const numbers = value.replace(/\D/g, "");
    const groups = numbers.match(/.{1,4}/g);
    return groups ? groups.join(" ") : numbers;
  };

  const formatExpiryDate = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + "/" + numbers.slice(2, 4);
    }
    return numbers;
  };

  return (
    <div className="payment-method-modal-overlay">
      <div className="payment-method-modal-content">
        <div className="payment-method-modal-header">
          <h2 className="payment-method-modal-title">결제 수단 관리</h2>
          <button className="payment-method-modal-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="payment-method-modal-body">
          {/* 등록된 결제 수단 목록 */}
          <div className="payment-methods-section">
            <h3 className="section-title">등록된 결제 수단</h3>
            <div className="payment-methods-list">
              {paymentMethods.length === 0 ? (
                <div className="empty-state">
                  <p>등록된 결제 수단이 없습니다</p>
                </div>
              ) : (
                paymentMethods.map((method) => (
                  <div key={method.id} className="payment-method-item">
                    <div className="payment-method-info">
                      <IoCard className="card-icon" />
                      <div className="card-details">
                        <div className="card-name">
                          {method.cardType}
                          {method.isDefault && (
                            <span className="default-badge">기본</span>
                          )}
                        </div>
                        <div className="card-number">
                          **** **** **** {method.lastFourDigits}
                        </div>
                        <div className="card-expiry">
                          유효기간: {method.expiryDate}
                        </div>
                      </div>
                    </div>
                    <div className="payment-method-actions">
                      {!method.isDefault && (
                        <button
                          className="action-btn default-btn"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          <IoCheckmarkCircle />
                          기본으로 설정
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              className="add-payment-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <IoAddCircle />새 결제 수단 추가
            </button>
          </div>

          {/* 결제 수단 추가 폼 */}
          {showAddForm && (
            <div className="add-payment-form">
              <h3 className="form-title">카드 정보 입력</h3>

              <div className="form-group">
                <label>카드 번호</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  value={newCard.cardNumber}
                  onChange={(e) =>
                    setNewCard({
                      ...newCard,
                      cardNumber: formatCardNumber(e.target.value),
                    })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>유효기간</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength="5"
                    value={newCard.expiryDate}
                    onChange={(e) =>
                      setNewCard({
                        ...newCard,
                        expiryDate: formatExpiryDate(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    maxLength="3"
                    value={newCard.cvc}
                    onChange={(e) =>
                      setNewCard({
                        ...newCard,
                        cvc: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>카드 소유자명</label>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={newCard.cardholderName}
                  onChange={(e) =>
                    setNewCard({ ...newCard, cardholderName: e.target.value })
                  }
                />
              </div>

              <div className="form-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  취소
                </button>
                <button className="submit-btn" onClick={handleAddCard}>
                  추가하기
                </button>
              </div>
            </div>
          )}

          {/* 안내 사항 */}
          <div className="payment-info">
            <h4>💳 안전한 결제</h4>
            <ul>
              <li>모든 결제 정보는 암호화되어 안전하게 저장됩니다</li>
              <li>PCI-DSS 인증을 받은 결제 시스템을 사용합니다</li>
              <li>카드 정보는 절대 외부에 공유되지 않습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
