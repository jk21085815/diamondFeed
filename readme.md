#####
POST http://dev.ollscores.com/api/v1/Account/deposit {for deposit ammount from parent user to child user}
Content-type: application/json
{
    "userId":"64369cbf7996dd61fee20c99",
    "amount":50000
}


#####
GET http://dev.ollscores.com/api/v1/Account/getAllStatement {for get all Account statement}


#####
POST http://dev.ollscores.com/api/v1/Account/withdrawl {for withraw amount from user to parent user}
Content-type: application/json
{
    "userId":"64354ac6784698f8570ad94f",
    "amount":150000
}

#####
POST http://dev.ollscores.com/api/v1/auth/userLogin {for user login}
Content-type: application/json
{
    "userName":"user",
    "password":"Jk@2108@jk"
}

#####
POST http://dev.ollscores.com/api/v1/auth/userSignUp {only for user lavel}
Content-type: application/json
{
    "name":"jayesh khuman",
    "password":"Jk@2108@jk",
    "passwordConfirm":"Jk@2108@jk",
    "userName":"Jk"
}

#####
GET http://dev.ollscores.com/api/v1/auth/logOut {logOut}

#####
POST http://dev.ollscores.com/api/v1/role/createRole {for create ROle only authorised can do it}
Content-type: application/json
{
    "roleName":"Duper-Admin",
    "roleType":4,
    "authorization":[]
}

#####
POST http://dev.ollscores.com/api/v1/role/addAuthorization {can add authorization in any role(in authorization field)}
Content-type: application/json
{
        "id":"642fe6c677055e0902e8a4e1",
        "authorization":["accountControl"]
}

#####
POST http://dev.ollscores.com/api/v1/role/deleteAuthorization {can delete authorization in any role(in authorization field)}
Content-type: application/json
{
    "id":"642ffec2d657ea2d8dfee360",
    "authorization":["betLockAndUnloack", "userStatus"]
}

#####
GET http://dev.ollscores.com/api/v1/role/getAllRoles {get all role type only lower role}

#####
POST http://dev.ollscores.com/api/v1/role/updateRoleLavel/:id {update role lavel by id} 
Content-type: application/json
{
    "roleType":2
}
{in this case role updated by current level to lavel 2}

#####
POST http://dev.ollscores.com/api/v1/users/createUser {for create user only lower level user}
Content-type: application/json
{
    "userName":"super-Admin",
    "name":"super-Admin",
    "phoneNumber":63531269,
    "password":"Jk@2108@jk",
    "passwordConfirm":"Jk@2108@jk",
    "role":"64363f8d84cdf717ca8d96e5"
}

#####
POST http://dev.ollscores.com/api/v1/users/deleteUser {for delete user only lower level user}
Content-type: application/json
{
    "id" : "642d5543f5226947489cdf48"
}

#####
POST http://dev.ollscores.com/api/v1/users/updateUserStatusInactive {update user status inActive only lower level user}
Content-type: application/json
{
    "id":"64354ac6784698f8570ad94f"
}

#####
POST http://dev.ollscores.com/api/v1/users/updateUserStatusActive {update user status Active only lower level user}
Content-type: application/json
{
    "id":"643403a6cc09bb65bc336d9a"
}

#####
GET http://dev.ollscores.com/api/v1/users/getAllUsers {get all user but only lower level}

#####
POST http://dev.ollscores.com/api/v1/users/updateUserStatusBettingLock {update user betting lock but only lower users}
Content-type: application/json
{
    "id":"643002fb97f6959d794b7dcc"
}

#####
POST http://dev.ollscores.com/api/v1/users/updateUserStatusBettingUnlock {update user betting unlock but only lower users}
Content-type: application/json
{
    "id":"643002fb97f6959d794b7dcc"
}

#####
POST http://dev.ollscores.com/api/v1/users/changeUserPassword {change password for child user}
Content-type: application/json
{
    "id":"64354ac6784698f8570ad94f",
    "password":"Jk@2108@jk",
    "passwordConfirm":"Jk@2108@jk"
}

#####
GET http://dev.ollscores.com/api/v1/users/getOnlineUsers (get online child user )

#####
GET http://dev.ollscores.com/api/v1/users/searchUser?search=a {search child use by name}

#####
GET http://dev.ollscores.com/api/v1/deshBoard/getDeshboardUserManagement {get all details for deshboard page}

#####
GET http://dev.ollscores.com/api/v1/auth/logOutAllUser {logOut all child user}

#####
POST http://dev.ollscores.com/api/v1/auth/logOutSelectedUser {logOut selected user}
Content-type: application/json
{
    "userId":"6438f3b5d2eb67c8f67fe065"
}

#####
GET http://dev.ollscores.com/api/v1/users/getUserLoginLogs {get user login logs or all login logs}
Content-type: application/json
{
    "id":"64369cbf7996dd61fee20c99"
}