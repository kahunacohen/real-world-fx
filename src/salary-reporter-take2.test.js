const { compose, curry, filter, join } = require("ramda");
const fs = require("fs");
const path = require("path");

const censor = (s) =>
  s.replace(/\d{3}-\d{2}-(\d{4})/g, (_, lastFour) => `xxx-xx-${lastFour}`);

const sortByLastName = (xs) => {
  return xs.sort((firstEl, secondEl) => {
    if (firstEl.lastName < secondEl.lastName) {
      return -1;
    }
    if (firstEl.lastName > secondEl.lastName) {
      return 1;
    }
    return 0;
  });
};

const JSONtoTable = (employees) => {
  return [
    ["Last Name", "First Name", "Total Pay", "Social Security Number"],
  ].concat(
    employees.map((x) => [
      x.lastName,
      x.firstName,
      x.socialSecurity,
      x.pay.reduce((acc, curr) => acc + curr),
    ])
  );
};

const employeeJSONToTable = compose(
  JSONtoTable,
  sortByLastName,
  filter((x) => x.active),
  JSON.parse,
  censor
);

const employeesToCSV = compose(join("\n"), employeeJSONToTable);

const toHTML = (tableData) => {
  const headerRow =
    "<tr>" +
    tableData[0].map((heading) => `<th>${heading}</th>`).join("") +
    "</tr>";

  const dataRows = tableData
    .slice(1) // Everything but the first row
    .map((row) => {
      const cells = row.map((data) => `<td>${data}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `
  <table>
    <thead>
      ${headerRow}
    </thead>
    <tbody>
      ${dataRows}
    </tbody>
  </table>`;
};

const employeesToHTML = compose(toHTML, employeeJSONToTable);

describe("employees", () => {
  let employeesStr;
  beforeAll(() => {
    employeesStr = fs.readFileSync(`${__dirname}/employees.json`, {
      encoding: "utf-8",
    });
  });
  it("toCSV", () => {
    expect(employeesToCSV(employeesStr)).toEqual(
      "Last Name,First Name,Total Pay,Social Security Number\nDoe,John,xxx-xx-2588,97234.76\nJane,Mary,xxx-xx-6322,151928.21"
    );
  });
  it("toHTML", () => {
    expect(employeesToHTML(employeesStr)).toEqual(
      expect.stringContaining(
        "<tr><td>Doe</td><td>John</td><td>xxx-xx-2588</td><td>97234.76</td></tr><tr><td>Jane</td><td>Mary</td><td>xxx-xx-6322</td><td>151928.21</td></tr>"
      )
    );
  });
});

const sortByLastName2 = (xs, order) => {
  return xs.sort((firstEl, secondEl) => {
    if (firstEl.lastName < secondEl.lastName) {
      return order === "asc" ? -1 : 1;
    }
    if (firstEl.lastName > secondEl.lastName) {
      return order === "asc" ? 1 : -1;
    }
    return 0;
  });
};
const sortByLastName3 = (order, xs) => {
  return xs.sort((firstEl, secondEl) => {
    if (firstEl.lastName < secondEl.lastName) {
      return order === "desc" ? 1 : -1;
    }
    if (firstEl.lastName > secondEl.lastName) {
      return order === "desc" ? -11 : 1;
    }
    return 0;
  });
};

describe("parameterized sort fn", () => {
  let employeesStr;
  beforeAll(() => {
    employeesStr = fs.readFileSync(`${__dirname}/employees.json`, {
      encoding: "utf-8",
    });
  });
  it("sorts asc", () => {
    expect(
      sortByLastName2(
        [{ lastName: "B" }, { lastName: "A" }, { lastName: "C" }],
        "asc"
      )
    ).toEqual([{ lastName: "A" }, { lastName: "B" }, { lastName: "C" }]);
  });
  it("sorts desc", () => {
    expect(
      sortByLastName2(
        [{ lastName: "B" }, { lastName: "A" }, { lastName: "C" }],
        "desc"
      )
    ).toEqual([{ lastName: "C" }, { lastName: "B" }, { lastName: "A" }]);
  });
  it("throws a type error when not curried and order is the last parameter", () => {
    expect(() => {
      compose(
        JSONtoTable,
        sortByLastName2("desc"),
        filter((x) => x.active),
        JSON.parse,
        censor
      );
    }).toThrow(TypeError);
  });
  it("causes an error when not curried and the array is last parameter", () => {
    expect(() => {
      compose(
        JSONtoTable,
        sortByLastName3("desc"),
        filter((x) => x.active),
        JSON.parse,
        censor
      );
    }).toThrow(TypeError);
  });
});
