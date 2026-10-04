import 'package:flutter_test/flutter_test.dart';

import 'package:bickri_service_agency/app/app.dart';

void main() {
  testWidgets('Bickri app can be constructed', (tester) async {
    const app = BickriServiceAgencyApp();
    expect(app, isA<BickriServiceAgencyApp>());
  });
}
