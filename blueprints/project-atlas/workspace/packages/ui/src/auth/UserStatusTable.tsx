export function UserStatusTable() {
  return (
    <table>
      <caption>User access status</caption>
      <thead>
        <tr>
          <th scope="col">User</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Unavailable</td>
          <td>Provider disabled</td>
        </tr>
      </tbody>
    </table>
  );
}
