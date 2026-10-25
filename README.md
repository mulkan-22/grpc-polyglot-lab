# gRPC Polyglot Lab: Server Go, Client Python, Client Node.js

Langkah-langkah pengerjaan, dari awal sampai selesai

> **Windows:** jalankan perintah `echo ... >> .gitignore` di **Git Bash** (bukan PowerShell) supaya isi `.gitignore` tidak rusak. Jika `python` tidak dikenali, ganti dengan `py`.

## 0. Cek Prasyarat

```bash
git --version
python --version
node -v
npm -v
go version
protoc --version
```

Semua harus menampilkan nomor versi. Jika belum terpasang, instal dulu: Git (git-scm.com), Python 3.10+ (python.org, centang *Add to PATH*), Node.js LTS (nodejs.org), Go (go.dev), dan protoc (github.com/protocolbuffers/protobuf/releases, lalu tambahkan folder `bin` ke PATH).

## 1. Setup Folder dan Git

```bash
mkdir grpc-polyglot-lab
cd grpc-polyglot-lab
git init
echo "node_modules/" >> .gitignore
echo "__pycache__/" >> .gitignore
echo ".venv/" >> .gitignore
echo "*.exe" >> .gitignore
git add .gitignore
git commit -m "Initial commit: Add gitignore rules"
```

## 2. Tulis Kontrak API

Buat file `user.proto` di folder `grpc-polyglot-lab`:

```proto
syntax = "proto3";

package user;

// Opsi khusus untuk bahasa Go agar struktur output rapi
option go_package = "./pb";

// Kontrak Request: Klien wajib mengirim user_id berupa angka
message UserRequest {
  int32 user_id = 1;
}

// Kontrak Response: Server akan mengembalikan nama dan email
message UserResponse {
  string name = 1;
  string email = 2;
}

// Definisi Service gRPC
service UserService {
  rpc GetUserProfile (UserRequest) returns (UserResponse);
}
```

## 3. Server Go

```bash
mkdir go-server
cd go-server
go mod init go-server
go get google.golang.org/grpc
go get google.golang.org/protobuf
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

Kompilasi proto (dari dalam `go-server`):

```bash
protoc --proto_path=../ --go_out=. --go-grpc_out=. ../user.proto
```

Buat `go-server/main.go`:

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net"

    "go-server/pb"
    "google.golang.org/grpc"
)

type server struct {
    pb.UnimplementedUserServiceServer
}

func (s *server) GetUserProfile(ctx context.Context, req *pb.UserRequest) (*pb.UserResponse, error) {
    log.Printf("Menerima request untuk User ID: %d\n", req.GetUserId())
    if req.GetUserId() == 1 {
        return &pb.UserResponse{
            Name:  "MULKAN AZHIMA",
            Email: "HIMA@GMAIL.COM",
        }, nil
    }
    return &pb.UserResponse{
        Name:  "User Tidak Ditemukan",
        Email: "-",
    }, nil
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("Gagal listening port: %v", err)
    }
    s := grpc.NewServer()
    pb.RegisterUserServiceServer(s, &server{})
    fmt.Println("gRPC Server (Go) berjalan di port :50051...")
    if err := s.Serve(lis); err != nil {
        log.Fatalf("Gagal menjalankan server: %v", err)
    }
}
```

Rapikan dependensi:

```bash
go mod tidy
```

## 4. Client Python

```bash
cd ../
mkdir python-client
cd python-client
pip install grpcio grpcio-tools
python -m grpc_tools.protoc --proto_path=../ --python_out=. --grpc_python_out=. ../user.proto
```

Buat `python-client/client.py`:

```python
import grpc
import user_pb2
import user_pb2_grpc

def run():
    with grpc.insecure_channel('localhost:50051') as channel:
        stub = user_pb2_grpc.UserServiceStub(channel)
        response = stub.GetUserProfile(user_pb2.UserRequest(user_id=1))
        print("Nama  :", response.name)
        print("Email :", response.email)

if __name__ == '__main__':
    run()
```

## 5. Client Node.js

```bash
cd ../
mkdir node-client
cd node-client
npm init -y
npm install @grpc/grpc-js @grpc/proto-loader
```

Buat `node-client/client.js`:

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const userProto = grpc.loadPackageDefinition(packageDefinition).user;

function main() {
    const client = new userProto.UserService('localhost:50051', grpc.credentials.createInsecure());
    client.GetUserProfile({ user_id: 1 }, (error, response) => {
        if (!error) {
            console.log('Nama  :', response.name);
            console.log('Email :', response.email);
        } else {
            console.error('Terjadi error:', error);
        }
    });
}
main();
```

## 6. Struktur Akhir

```text
grpc-polyglot-lab/
├── .gitignore
├── user.proto
├── go-server/
│   ├── pb/
│   ├── go.mod
│   ├── go.sum
│   └── main.go
├── node-client/
│   ├── node_modules/
│   ├── client.js
│   ├── package-lock.json
│   └── package.json
└── python-client/
    ├── __pycache__/
    ├── client.py
    ├── user_pb2.py
    └── user_pb2_grpc.py
```

## 7. Pengujian

Buka 3 terminal terpisah.

**Terminal 1: server Go**

```bash
cd go-server
go run main.go
```

**Terminal 2: client Python**

```bash
cd python-client
python client.py
```

**Terminal 3: client Node.js**

```bash
cd node-client
node client.js
```

Hasil yang benar:

- Tidak ada error `Connection refused` atau `Cannot find module`.
- Terminal Python dan Node.js menampilkan `Nama  : MULKAN AZHIMA` dan `Email : HIMA@GMAIL.COM`.
- Terminal server Go menampilkan `Menerima request untuk User ID: 1` setiap kali client dijalankan.
- terima kasih.

