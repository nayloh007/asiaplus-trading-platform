/className={`mt-1 ${transaction.status === "approved" \? "bg-green-500 hover:bg-green-600 text-white" : ""}`}/ c\
                                  className={`mt-1 ${transaction.status === "approved" ? "bg-green-500 hover:bg-green-600 text-white" : transaction.status === "frozen" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
/variant={/,/"outline"/c\
                                  variant={\
                                    transaction.status === "rejected" ? "destructive" : \
                                    transaction.status === "approved" ? "default" : \
                                    transaction.status === "frozen" ? "warning" : "outline"\
                                  }
/{transaction.status === "pending" \? "รออนุมัติ" :/,/"ถูกปฏิเสธ"}/c\
                                  {transaction.status === "pending" ? "รออนุมัติ" : \
                                  transaction.status === "approved" ? "อนุมัติแล้ว" :\
                                  transaction.status === "frozen" ? "ถูกอายัด" :\
                                  "ถูกปฏิเสธ"}
