import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface InBodyManualFormProps {
  onSubmit: (data: any) => void;
}

const InBodyManualForm: React.FC<InBodyManualFormProps> = ({onSubmit}) => {
  const insets = useSafeAreaInsets();
  const [v, setV] = useState({
    date: new Date().toISOString().slice(0, 10),
    gender: 'female',
    age: '',
    height: '',
    weight: '',
    smm: '',
    bfm: '',
    pbf: '',
    score: '',
    vfa: '',
    bmr: '',
    rArm: '',
    lArm: '',
    trunk: '',
    rLeg: '',
    lLeg: '',
    ecw: '',
    wtCtrl: '',
    fatCtrl: '',
    musCtrl: '',
  });

  const bmi = useMemo(() => {
    const h = parseFloat(v.height);
    const w = parseFloat(v.weight);
    if (!h || !w) return '';
    const m = h / 100;
    return (w / (m * m)).toFixed(1);
  }, [v.height, v.weight]);

  const handle = (k: string) => (value: string) => {
    setV(s => ({...s, [k]: value}));
  };

  const handleSubmit = () => {
    const payload = {...v, bmi};
    onSubmit?.(payload);
  };

  const Field: React.FC<{label: string; children: React.ReactNode}> = ({
    label,
    children,
  }) => (
    <View style={formStyles.field}>
      <Text style={formStyles.lab}>{label}</Text>
      {children}
    </View>
  );

  const Unit: React.FC<{children: React.ReactNode}> = ({children}) => (
    <View style={formStyles.unitBox}>{children}</View>
  );

  const Small: React.FC<{
    label: string;
    v: string;
    onChange: (value: string) => void;
  }> = ({label, v, onChange}) => (
    <View style={formStyles.smallField}>
      <Text style={formStyles.smallLab}>{label}</Text>
      <View style={formStyles.unitBox}>
        <TextInput
          style={formStyles.inpRight}
          value={v}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholderTextColor="#666"
        />
        <Text style={formStyles.unit}>kg</Text>
      </View>
    </View>
  );

  const inputHeight = 40; // 입력창 높이 (paddingVertical 8px * 2 + 텍스트 높이 ~24px)
  const bottomPadding = Math.max(100, insets.bottom + inputHeight + 40);

  return (
    <ScrollView 
      style={formStyles.wrap} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[formStyles.scrollContent, {paddingBottom: bottomPadding}]}
    >
      {/* 기본 정보 */}
      <View style={formStyles.sec}>
        <Field label="검사일">
          <TextInput
            style={formStyles.inp}
            value={v.date}
            onChangeText={handle('date')}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#666"
          />
        </Field>
        <Field label="성별">
          <View style={formStyles.row}>
            <TouchableOpacity
              style={formStyles.radioButton}
              onPress={() => setV(s => ({...s, gender: 'male'}))}>
              <View
                style={[
                  formStyles.radioCircle,
                  v.gender === 'male' && formStyles.radioSelected,
                ]}
              />
              <Text style={formStyles.radioText}>남성</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={formStyles.radioButton}
              onPress={() => setV(s => ({...s, gender: 'female'}))}>
              <View
                style={[
                  formStyles.radioCircle,
                  v.gender === 'female' && formStyles.radioSelected,
                ]}
              />
              <Text style={formStyles.radioText}>여성</Text>
            </TouchableOpacity>
          </View>
        </Field>
        <Field label="나이">
          <Unit>
            <TextInput
              style={formStyles.inpRight}
              value={v.age}
              onChangeText={handle('age')}
              keyboardType="number-pad"
              placeholderTextColor="#666"
            />
            <Text style={formStyles.unit}>세</Text>
          </Unit>
        </Field>
        <Field label="신장">
          <Unit>
            <TextInput
              style={formStyles.inpRight}
              value={v.height}
              onChangeText={handle('height')}
              keyboardType="decimal-pad"
              placeholderTextColor="#666"
            />
            <Text style={formStyles.unit}>cm</Text>
          </Unit>
        </Field>
      </View>

      {/* 핵심 수치 */}
      <View style={formStyles.sec}>
        <Field label="체중">
          <Unit>
            <TextInput
              style={formStyles.inpRight}
              value={v.weight}
              onChangeText={handle('weight')}
              keyboardType="decimal-pad"
              placeholderTextColor="#666"
            />
            <Text style={formStyles.unit}>kg</Text>
          </Unit>
        </Field>
        <Field label="골격근량(SMM)">
          <Unit>
            <TextInput
              style={formStyles.inpRight}
              value={v.smm}
              onChangeText={handle('smm')}
              keyboardType="decimal-pad"
              placeholderTextColor="#666"
            />
            <Text style={formStyles.unit}>kg</Text>
          </Unit>
        </Field>
        <Field label="체지방량(BFM)">
          <Unit>
            <TextInput
              style={formStyles.inpRight}
              value={v.bfm}
              onChangeText={handle('bfm')}
              keyboardType="decimal-pad"
              placeholderTextColor="#666"
            />
            <Text style={formStyles.unit}>kg</Text>
          </Unit>
        </Field>
        <Field label="체지방률(PBF)">
          <Unit>
            <TextInput
              style={formStyles.inpRight}
              value={v.pbf}
              onChangeText={handle('pbf')}
              keyboardType="decimal-pad"
              placeholderTextColor="#666"
            />
            <Text style={formStyles.unit}>%</Text>
          </Unit>
        </Field>
        <Field label="BMI">
          <Unit>
            <TextInput
              style={[formStyles.inpRight, formStyles.inpReadOnly]}
              value={bmi}
              editable={false}
              placeholderTextColor="#666"
            />
            <Text style={formStyles.unit}>kg/m²</Text>
          </Unit>
        </Field>
      </View>

      {/* 점수/내장지방/BMR */}
      <View style={formStyles.sec}>
        <Field label="인바디 점수">
          <TextInput
            style={formStyles.inp}
            value={v.score}
            onChangeText={handle('score')}
            keyboardType="decimal-pad"
            placeholderTextColor="#666"
          />
        </Field>
        <Field label="내장지방면적(VFA)">
          <Unit>
            <TextInput
              style={formStyles.inpRight}
              value={v.vfa}
              onChangeText={handle('vfa')}
              keyboardType="decimal-pad"
              placeholderTextColor="#666"
            />
            <Text style={formStyles.unit}>cm²</Text>
          </Unit>
        </Field>
        <Field label="BMR">
          <Unit>
            <TextInput
              style={formStyles.inpRight}
              value={v.bmr}
              onChangeText={handle('bmr')}
              keyboardType="decimal-pad"
              placeholderTextColor="#666"
            />
            <Text style={formStyles.unit}>kcal</Text>
          </Unit>
        </Field>
      </View>

      {/* 부위별 근육량 */}
      <View style={formStyles.sec}>
        <Text style={formStyles.h3}>부위별 근육량 (kg)</Text>
        <View style={formStyles.grid}>
          <Small label="오른팔" v={v.rArm} onChange={handle('rArm')} />
          <Small label="왼팔" v={v.lArm} onChange={handle('lArm')} />
          <Small label="몸통" v={v.trunk} onChange={handle('trunk')} />
          <Small label="오른다리" v={v.rLeg} onChange={handle('rLeg')} />
          <Small label="왼다리" v={v.lLeg} onChange={handle('lLeg')} />
        </View>
      </View>

      {/* 수분비/체중조절 */}
      <View style={formStyles.sec}>
        <Field label="세포외수분비(ECW/TBW)">
          <TextInput
            style={formStyles.inp}
            value={v.ecw}
            onChangeText={handle('ecw')}
            keyboardType="decimal-pad"
            placeholderTextColor="#666"
          />
        </Field>
        <View style={formStyles.grid2}>
          <Field label="체중조절(±kg)">
            <Unit>
              <TextInput
                style={formStyles.inpRight}
                value={v.wtCtrl}
                onChangeText={handle('wtCtrl')}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
              />
              <Text style={formStyles.unit}>kg</Text>
            </Unit>
          </Field>
          <Field label="지방조절(kg)">
            <Unit>
              <TextInput
                style={formStyles.inpRight}
                value={v.fatCtrl}
                onChangeText={handle('fatCtrl')}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
              />
              <Text style={formStyles.unit}>kg</Text>
            </Unit>
          </Field>
          <Field label="근육조절(kg)">
            <Unit>
              <TextInput
                style={formStyles.inpRight}
                value={v.musCtrl}
                onChangeText={handle('musCtrl')}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
              />
              <Text style={formStyles.unit}>kg</Text>
            </Unit>
          </Field>
        </View>
      </View>

      <TouchableOpacity style={formStyles.submit} onPress={handleSubmit}>
        <Text style={formStyles.submitText}>저장</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const formStyles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#1b1b1b',
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  h3: {
    marginVertical: 6,
    fontSize: 13,
    color: '#c9c9c9',
  },
  sec: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: 8,
    marginTop: 8,
  },
  field: {
    marginBottom: 8,
  },
  lab: {
    fontSize: 11,
    color: '#bdbdbd',
    marginBottom: 4,
  },
  inp: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#343434',
    backgroundColor: '#242424',
    color: '#ffffff',
    fontSize: 14,
  },
  inpRight: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#343434',
    backgroundColor: '#242424',
    color: '#ffffff',
    fontSize: 14,
  },
  inpReadOnly: {
    backgroundColor: '#2b2b2b',
  },
  unitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unit: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#2b2b2b',
    color: '#d5d5d5',
    fontSize: 11,
    borderWidth: 1,
    borderColor: '#353535',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#666',
  },
  radioSelected: {
    backgroundColor: '#d6ff4b',
    borderColor: '#d6ff4b',
  },
  radioText: {
    fontSize: 13,
    color: '#ffffff',
  },
  grid: {
    gap: 8,
  },
  smallField: {
    marginBottom: 8,
  },
  smallLab: {
    fontSize: 11,
    color: '#bdbdbd',
    marginBottom: 4,
  },
  grid2: {
    gap: 8,
    marginTop: 4,
  },
  submit: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#d6ff4b',
    alignItems: 'center',
  },
  submitText: {
    color: '#111111',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default InBodyManualForm;
