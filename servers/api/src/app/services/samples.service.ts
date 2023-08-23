import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import _ from 'lodash';

import { FirebaseInfo } from '@/app/modules/firebase.module';
import { Coded } from '@/app/utils/coded';
import { Service } from '@/app/utils/decorators';

@Service()
@Injectable()
export class SampleService implements Coded {
  private readonly logger = new Logger(SampleService.name);

  constructor(private readonly firebase: FirebaseInfo) {
    // nothing to do
  }

  get db(): Firestore {
    return this.firebase.db;
  }

  get code(): string {
    return 'SSM'; // Service - SaMples
  }

  getHello(): string {
    return 'Hello World!';
  }

  async getFoo(id: string) {
    const collectionRef = this.db.collection('foo');
    const d = await collectionRef.doc(id).get();
    if (d.exists) {
      this.logger.log('+++ Foo - OK +++');
      return d.data();
    }
    this.logger.log('not exist');
    return null;
  }

  async getFirebaseUsers() {
    const result = await this.firebase.auth.listUsers();
    const users = result.users;
    users.forEach((user) => {
      this.logger.log(user);
    });
  }
}
