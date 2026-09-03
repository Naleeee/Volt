import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("joins rows with CRLF and ends with one", () => {
    expect(toCsv(["a", "b"], [[1, 2]])).toBe("a,b\r\n1,2\r\n");
  });

  it("renders null and undefined as empty fields", () => {
    expect(toCsv(["a", "b", "c"], [[null, undefined, 0]])).toBe(
      "a,b,c\r\n,,0\r\n",
    );
  });

  it("quotes fields holding commas, quotes or line breaks", () => {
    expect(toCsv(["v"], [["a,b"]])).toBe('v\r\n"a,b"\r\n');
    expect(toCsv(["v"], [['say "hi"']])).toBe('v\r\n"say ""hi"""\r\n');
    expect(toCsv(["v"], [["line1\nline2"]])).toBe('v\r\n"line1\nline2"\r\n');
  });

  it("passes booleans and numbers through as text", () => {
    expect(toCsv(["v", "w"], [[true, 12.5]])).toBe("v,w\r\ntrue,12.5\r\n");
  });
});
