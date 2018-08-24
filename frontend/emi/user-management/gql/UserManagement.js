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

//Gets the roles that the petitioner user can assign to other users
export const getRoles = gql`
  query getRoles{
    getRoles{
      id
      name
    }
  }
`;

// MUTATIONS
export const addRolesToTheUser = gql`
  mutation addRolesToTheUser($userId: ID, $input: RolesInput) {
    addRolesToTheUser(userId: $userId, input: $input) {
      code
      message
    }
  }
`;

export const removeRolesFromUser = gql`
  mutation removeRolesFromUser($userId: ID, $input: RolesInput) {
    removeRolesFromUser(userId: $userId, input: $input) {
      code
      message
    }
  }
`;

export const createUser = gql`
  mutation createUser($input: UserInput) {
    createUser(input: $input) {
      code
      message
    }
  }
`;

export const updateUserGeneralInfo = gql`
  mutation updateUserGeneralInfo($userId: ID,$input: UserInput) {
    updateUserGeneralInfo(userId: $userId, input: $input) {
      code
      message
    }
  }
`;

export const updateUserState = gql`
  mutation updateUserState($userId: ID!, $username: String!, $state: Boolean!) {
    updateUserState(userId: $userId, username: $username, state: $state) {
      code
      message
    }
  }
`;

export const resetUserPassword = gql`
  mutation resetUserPassword($userId: ID!, $input: UserPasswordInput) {
    resetUserPassword(userId: $userId, input: $input) {
      code
      message
    }
  }
`;
