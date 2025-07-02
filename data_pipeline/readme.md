# 차트 시스템 예시 데이터와 생성 지침

## 🔍 시스템 독립성 확인 완료

### ✅ 완전히 독립적인 두 시스템
- **2D 차트 시스템**: Chart.js 기반 → `generateChart(rawData, config, containerElement)`
- **3D 차트 시스템**: Plotly.js 기반 → `generateChart3D(rawData, config3D, containerElement)`

### 📦 공통 의존성 모듈
- `data_pipeline/index.js` - 데이터 검증 (dataValidator.analyzeDataFieldTypes)
- `shared/error_handler.js` - 에러 처리 유틸리티

---

## 📊 예시 데이터 (rawData)

### 기본 형식
```javascript
// 모든 차트 시스템에서 공통으로 사용하는 형식
const rawData = [
  {field1: value1, field2: value2, field3: value3, ...},
  {field1: value1, field2: value2, field3: value3, ...},
  // ...
];
```

### 1. 숫자 데이터 예시 (과학/공학 데이터)
```javascript
const scientificData = [
  {temperature: 20.5, pressure: 1013.25, humidity: 65.2, location: "Seoul", timestamp: "2024-01-01"},
  {temperature: 22.1, pressure: 1010.80, humidity: 70.8, location: "Busan", timestamp: "2024-01-02"},
  {temperature: 18.9, pressure: 1015.30, humidity: 58.9, location: "Jeju", timestamp: "2024-01-03"},
  {temperature: 25.3, pressure: 1008.95, humidity: 72.1, location: "Seoul", timestamp: "2024-01-04"},
  {temperature: 21.7, pressure: 1012.40, humidity: 68.5, location: "Busan", timestamp: "2024-01-05"}
];
```

### 2. 비즈니스 데이터 예시 (매출/마케팅)
```javascript
const businessData = [
  {revenue: 150000, customers: 245, region: "North", quarter: "Q1", satisfaction: 4.2},
  {revenue: 180000, customers: 289, region: "South", quarter: "Q1", satisfaction: 4.5},
  {revenue: 165000, customers: 267, region: "East", quarter: "Q1", satisfaction: 4.1},
  {revenue: 195000, customers: 312, region: "West", quarter: "Q1", satisfaction: 4.7},
  {revenue: 175000, customers: 278, region: "North", quarter: "Q2", satisfaction: 4.3}
];
```

### 3. 3D 차트용 수학 함수 데이터
```javascript
const mathFunctionData = [
  {x: 0, y: 0, z: 0},
  {x: 1, y: 0, z: 1},
  {x: 0, y: 1, z: 1},
  {x: 1, y: 1, z: 2},
  {x: 2, y: 0, z: 4},
  {x: 0, y: 2, z: 4},
  {x: 2, y: 2, z: 8},
  {x: 1, y: 2, z: 5}
];
```

---

## ⚙️ 설정 데이터 (config/config3D)

### 2D 차트 설정 (config)
```javascript
// 기본 2D 산점도
const config2D_scatter = {
  type: 'scatter',
  dataMapping: {
    x: 'temperature',     // X축 필드 (문자열/숫자 모두 가능)
    y: 'pressure'         // Y축 필드 (숫자만 가능)
  },
  options: {}             // Chart.js 추가 옵션
};

// 크기+색상 인코딩
const config2D_size_color = {
  type: 'size_color',
  dataMapping: {
    x: 'temperature',     // X축
    size: 'humidity',     // 크기 (숫자만)
    color: 'pressure'     // 색상 (숫자만)
  },
  options: {}
};

// 4차원 산점도 (최대 차원)
const config2D_4dim = {
  type: 'scatter_size_color',
  dataMapping: {
    x: 'temperature',     // X축
    y: 'pressure',        // Y축
    size: 'humidity',     // 크기
    color: 'satisfaction' // 색상
  },
  options: {}
};

// 문자열 그룹 차트
const config2D_grouped = {
  type: 'grouped_bar',
  dataMapping: {
    x: 'region',          // 그룹 (문자열)
    y: 'quarter',         // X축
    size: 'revenue'       // Y축 (숫자)
  },
  options: {}
};
```

### 3D 차트 설정 (config3D)
```javascript
// 3D Surface + Scatter
const config3D_surface_scatter = {
  type: '3d_surface_scatter',
  dataMapping: {
    x: 'x',               // X축 (필수)
    y: 'y',               // Y축 (필수)
    z: 'z'                // Z축 (필수)
  },
  options: {
    cameraPosition: {
      eye: {x: 1.5, y: 1.5, z: 1.5}
    },
    opacity: {
      surface: 0.7,
      scatter: 0.8
    }
  }
};

// 3D Surface만
const config3D_surface_only = {
  type: '3d_surface_only',
  dataMapping: {
    x: 'temperature',
    y: 'pressure', 
    z: 'humidity'
  },
  options: {}
};
```

### 컨테이너 엘리먼트
```javascript
// HTML DOM 엘리먼트
const containerElement = document.getElementById('chartContainer');
// 또는
const containerElement = document.createElement('div');
containerElement.style.width = '800px';
containerElement.style.height = '600px';
```

---

## 🎯 지원되는 차트 타입들

### 2D 차트 타입들 (Chart.js)
```javascript
// 1차원
'line1d'                    // 1D 선형 차트
'category'                  // 카테고리 막대 차트

// 2차원  
'scatter'                   // 기본 산점도
'size'                      // 크기 인코딩
'color'                     // 색상 인코딩
'bar', 'bar_size', 'bar_color'  // 막대 차트들

// 3차원
'scatter_size'              // 산점도 + 크기
'scatter_color'             // 산점도 + 색상  
'size_color'                // 크기 + 색상
'grouped_bar', 'grouped_bar_size', 'grouped_bar_color'  // 그룹 막대

// 4차원 (최대)
'scatter_size_color'        // 산점도 + 크기 + 색상
'grouped_scatter_size_color'  // 그룹 산점도 + 크기 + 색상
```

### 3D 차트 타입들 (Plotly)
```javascript
// 구현 완료
'3d_surface_scatter'        // Surface + Scatter 조합
'3d_surface_only'           // Surface만
'3d_scatter_only'           // Scatter만

// 구현 예정
'3d_wireframe'              // 와이어프레임
'3d_mesh'                   // 메시
'3d_volume'                 // 볼륨
```

---

## 📝 데이터 생성 함수 작성 지침

### 1. rawData 생성 지침

#### 필수 요구사항
- **형식**: 객체 배열 `[{}, {}, ...]`
- **일관성**: 모든 객체가 동일한 필드 구조
- **타입**: 각 필드는 일관된 타입 (string 또는 number)
- **크기**: 최소 2개 이상 권장

#### 필드 타입 규칙
```javascript
// 데이터 검증기가 분석하는 기준
function analyzeFieldType(values) {
  const numericRatio = values.filter(v => !isNaN(v)).length / values.length;
  
  if (numericRatio > 0.8) return 'double';  // 80% 이상 숫자
  else return 'string';                     // 나머지는 문자열
}
```

#### 축별 제약사항
- **X축 (첫번째)**: 모든 타입 허용 (string/double)
- **Y/Z/W축**: 숫자(double)만 허용
- **크기/색상**: 숫자(double)만 허용

### 2. config 생성 지침

#### 2D config 구조
```javascript
{
  type: '<chart_type>',        // 필수: 차트 타입
  dataMapping: {               // 필수: 필드 매핑
    x: '<field_name>',         // 필수
    y: '<field_name>',         // 2차원 이상시 필수
    size: '<field_name>',      // 선택사항
    color: '<field_name>'      // 선택사항
  },
  options: {}                  // 선택사항: Chart.js 옵션
}
```

#### 3D config 구조
```javascript
{
  type: '<3d_chart_type>',     // 필수: 3D 차트 타입
  dataMapping: {               // 필수: 필드 매핑
    x: '<field_name>',         // 필수
    y: '<field_name>',         // 필수
    z: '<field_name>'          // 필수
  },
  options: {}                  // 선택사항: Plotly 옵션
}
```

### 3. 특별 제약사항

#### 3D 차트 데이터 제한
```javascript
// 3D는 성능상 16개로 자동 제한됨
// generateChart3D 내부에서 rawData.slice(0, 16) 처리
```

#### 필드명 유효성
```javascript
// 기본적인 필드명 패턴 (영문, 숫자, 언더스코어)
const isValidFieldName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName);
```

### 4. 데이터 생성 함수 템플릿

```javascript
function generateExampleData(type, count = 20) {
  const data = [];
  
  for (let i = 0; i < count; i++) {
    switch (type) {
      case 'scientific':
        data.push({
          temperature: 15 + Math.random() * 20,
          pressure: 1000 + Math.random() * 30,
          humidity: 40 + Math.random() * 40,
          location: ['Seoul', 'Busan', 'Jeju'][i % 3],
          timestamp: new Date(2024, 0, i + 1).toISOString()
        });
        break;
        
      case '3d_math':
        data.push({
          x: i % 4,
          y: Math.floor(i / 4) % 4,
          z: Math.sin(i * 0.1) * 10
        });
        break;
        
      case 'business':
        data.push({
          revenue: 100000 + Math.random() * 100000,
          customers: 200 + Math.random() * 200,
          region: ['North', 'South', 'East', 'West'][i % 4],
          quarter: ['Q1', 'Q2', 'Q3', 'Q4'][i % 4],
          satisfaction: 3.5 + Math.random() * 1.5
        });
        break;
    }
  }
  
  return data;
}
```

### 5. 검증 및 디버깅

#### 필드 타입 분석 확인
```javascript
import { dataValidator } from './data_pipeline/index.js';

const fieldTypes = dataValidator.analyzeDataFieldTypes(rawData);
console.log('필드 타입:', fieldTypes);
// 예상 결과: {temperature: 'double', location: 'string', ...}
```

#### 사용 예시
```javascript
// 2D 차트 생성
const chart2D = generateChart(rawData, config2D, containerElement);

// 3D 차트 생성  
const chart3D = generateChart3D(rawData, config3D, containerElement);

// 이벤트 리스너
chart2D.on('dataUpdated', (data) => console.log('2D 데이터 업데이트:', data));
chart3D.on('resized', (size) => console.log('3D 리사이즈:', size));
```

이 지침을 따라 데이터 생성 함수를 작성하면 두 시스템 모두에서 완벽하게 작동하는 예시 데이터를 만들 수 있습니다.