/**
 * Safely evaluates a formula string with variable substitution
 * Supports: +, -, *, /, parentheses, and numeric values
 */
export function evaluateFormula(
  formula: string,
  data: Record<string, number | null | undefined>
): number | null {
  if (!formula || !formula.trim()) {
    return null;
  }

  try {
    // Extract all variable names from the formula
    const variablePattern = /[a-zA-Z_][a-zA-Z0-9_]*/g;
    const variables = formula.match(variablePattern) || [];
    
    // Create a working copy of the formula
    let expression = formula;
    
    // Replace each variable with its value
    for (const variable of variables) {
      const value = data[variable];
      
      // If any variable is null/undefined, we can't calculate
      if (value === null || value === undefined) {
        return null;
      }
      
      // Replace all occurrences of the variable with its value
      const regex = new RegExp(`\\b${variable}\\b`, 'g');
      expression = expression.replace(regex, String(value));
    }
    
    // Validate the expression only contains allowed characters
    const allowedPattern = /^[\d\s+\-*/().]+$/;
    if (!allowedPattern.test(expression)) {
      console.error('Invalid formula expression:', expression);
      return null;
    }
    
    // Evaluate the expression safely
    const result = Function(`"use strict"; return (${expression})`)();
    
    // Check for valid numeric result
    if (typeof result !== 'number' || !isFinite(result)) {
      return null;
    }
    
    return result;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return null;
  }
}

/**
 * Extracts variable names from a formula
 */
export function extractVariables(formula: string): string[] {
  if (!formula) return [];
  
  const variablePattern = /[a-zA-Z_][a-zA-Z0-9_]*/g;
  const matches = formula.match(variablePattern) || [];
  
  // Remove duplicates
  return [...new Set(matches)];
}

/**
 * Validates a formula syntax
 */
export function validateFormula(
  formula: string,
  availableColumns: string[]
): { valid: boolean; error?: string } {
  if (!formula || !formula.trim()) {
    return { valid: false, error: 'Fórmula não pode estar vazia' };
  }

  // Extract variables
  const variables = extractVariables(formula);
  
  // Check if all variables exist in available columns
  const unknownVariables = variables.filter(v => !availableColumns.includes(v));
  if (unknownVariables.length > 0) {
    return { 
      valid: false, 
      error: `Colunas desconhecidas: ${unknownVariables.join(', ')}` 
    };
  }

  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of formula) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      return { valid: false, error: 'Parênteses desbalanceados' };
    }
  }
  if (parenCount !== 0) {
    return { valid: false, error: 'Parênteses desbalanceados' };
  }

  // Test evaluation with dummy data
  const testData: Record<string, number> = {};
  for (const v of variables) {
    testData[v] = 1;
  }
  
  const result = evaluateFormula(formula, testData);
  if (result === null) {
    return { valid: false, error: 'Erro de sintaxe na fórmula' };
  }

  return { valid: true };
}

/**
 * Formats a value according to the format type
 */
export function formatMetricValue(
  value: number | null,
  formatType: 'number' | 'currency' | 'percent',
  decimalPlaces: number = 2
): string {
  if (value === null) return '-';

  switch (formatType) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(value);
    
    case 'percent':
      return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(value / 100);
    
    default:
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimalPlaces,
      }).format(value);
  }
}

