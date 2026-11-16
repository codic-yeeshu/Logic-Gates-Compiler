export const examples: Record<string, string> = {
  Introduction: `// Combine three inputs into one output\nINPUT a, b, c;\nWIRE intermediate;\nOUTPUT out;\n\nintermediate = a AND b;\nout = intermediate OR NOT c;`,
  "Full adder": `INPUT a, b, carry_in;\nWIRE partial;\nOUTPUT sum, carry_out;\n\npartial = a XOR b;\nsum = partial XOR carry_in;\ncarry_out = (a AND b) OR (partial AND carry_in);`,
  "Half adder": `INPUT a, b;\nOUTPUT sum, carry;\nsum = a XOR b;\ncarry = a AND b;`,
  Multiplexer: `INPUT a, b, select;\nOUTPUT out;\nout = (a AND NOT select) OR (b AND select);`,
  Optimization: `INPUT a, b;\nWIRE first, second, unused;\nOUTPUT out;\nfirst = a AND b;\nsecond = b AND a;\nunused = a OR b;\nout = (first OR second) AND 1;`,
  "Find the error": `INPUT a;\nOUTPUT out;\nout = a AND missing;`,
};
