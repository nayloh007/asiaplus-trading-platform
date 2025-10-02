export function formatCurrency(value: number): string {
  // ใช้ค่าคงที่เพื่อแก้ปัญหา maximumFractionDigits
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'always',
  }).format(value / 100);
}

export function formatShortDate(date: Date | string | null): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid to prevent RangeError
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date value passed to formatShortDate:', date);
    return 'Invalid Date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function getTimeLabels(dataPoints: number): string[] {
  const now = new Date();
  const labels: string[] = [];
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000); // 1 hour intervals
    labels.push(time.getHours().toString().padStart(2, '0') + ':00');
  }
  
  return labels;
}

export function getShortenedName(name: string, maxLength = 10): string {
  return name.length > maxLength ? name.slice(0, maxLength) + '...' : name;
}
