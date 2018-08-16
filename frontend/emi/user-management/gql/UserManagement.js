import gql from "graphql-tag";

// We use the gql tag to parse our query string into a query document

//Gets the users filtered by page, count and search filter
export const getUsers = gql`
  query getUsers($page: Int!, $count: Int!, $searchFilter: String){
    getUsers(page: $page, count: $count, searchFilter: $searchFilter){
      id
      username
      generalInfo{
        name
        lastname
        documentType
        documentId
        email
        phone
      }
      state
    }
  }
`;

//Gets the users filtered by page, count and search filter
export const getUser = gql`
  query getUser($username: String!){
    getUser(username: $username){
      id
      username
      generalInfo{
        name
        lastname
        documentType
        documentId
        email
        phone
      }
      state
    }
  }
`;

// MUTATIONS
export const createUser = gql`
  mutation createUser($input: UserInput) {
    createUser(input: $input) {
      code
      message
    }
  }
`;

